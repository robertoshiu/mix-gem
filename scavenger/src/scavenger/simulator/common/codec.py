# scavenger/src/scavenger/simulator/common/codec.py
"""SECS-II codec wrapper around secsgem."""
from dataclasses import dataclass
from typing import Any

import secsgem.common
import secsgem.secs


@dataclass
class EncodedMessage:
    """Result of encoding a SECS-II message."""

    stream: int
    function: int
    wbit: bool
    binary: bytes
    sml: str


@dataclass
class DecodedMessage:
    """Result of decoding a SECS-II message."""

    stream: int
    function: int
    wbit: bool
    body: Any


class SecsCodec:
    """Wrapper around secsgem for SECS-II encode/decode with JSON interop."""

    def encode(
        self,
        stream: int,
        function: int,
        wbit: bool,
        body: Any,
    ) -> EncodedMessage:
        """Encode a SECS-II message to binary format.

        Args:
            stream: SECS stream number
            function: SECS function number
            wbit: Wait bit (True for request expecting reply)
            body: Message body (dict, list, or primitive)

        Returns:
            EncodedMessage with binary and SML representation

        Note:
            The binary format includes a custom 2-byte header:
            - Byte 0: Stream (bits 0-6) + W-bit (bit 7)
            - Byte 1: Function
            - Bytes 2+: secsgem-encoded body (if present)

            This allows us to preserve the W-bit through encode/decode cycles.
        """
        # Convert Python types to secsgem data items
        secs_data = self._python_to_secs(body) if body is not None else None

        # Build the message using secsgem
        msg = self._build_message(stream, function, wbit, secs_data)

        # Get the secsgem-encoded body
        body_binary = msg.encode() if hasattr(msg, 'encode') else b""

        # Build our custom binary format: [stream+wbit byte][function byte][body...]
        stream_byte = stream & 0x7F  # Stream in bits 0-6
        if wbit:
            stream_byte |= 0x80  # W-bit in bit 7

        function_byte = function & 0xFF

        binary = bytes([stream_byte, function_byte]) + body_binary

        return EncodedMessage(
            stream=stream,
            function=function,
            wbit=wbit,
            binary=binary,
            sml=self.to_sml(stream, function, wbit, body),
        )

    def decode(self, data: bytes) -> DecodedMessage:
        """Decode binary SECS-II message.

        Args:
            data: Raw binary message

        Returns:
            DecodedMessage with parsed body
        """
        # Parse binary data manually
        # For now, create a minimal implementation
        # Real implementation would parse SECS-II binary format
        msg = self._parse_message(data)
        body = self._secs_to_python(msg.data) if msg.data is not None else None

        return DecodedMessage(
            stream=msg.stream,
            function=msg.function,
            wbit=msg.wbit,
            body=body,
        )

    def to_sml(
        self,
        stream: int,
        function: int,
        wbit: bool,
        body: Any,
    ) -> str:
        """Generate human-readable SML representation.

        Args:
            stream: SECS stream number
            function: SECS function number
            wbit: Wait bit
            body: Message body

        Returns:
            SML string
        """
        w_str = " W" if wbit else ""
        header = f"S{stream}F{function}{w_str}"

        if body is None:
            return f"{header} ."

        body_sml = self._body_to_sml(body)
        return f"{header}\n{body_sml}\n."

    def _python_to_secs(self, value: Any) -> Any:
        """Convert Python type to secsgem data item."""
        from secsgem.secs.variables import Array, U1, U2, U4, I4, F4, Boolean, String as A, Binary

        if isinstance(value, list):
            # Determine the type of items
            if not value:
                return Array(A, [])
            # Convert each item recursively
            converted_items = []
            for item in value:
                if isinstance(item, (dict, list)):
                    converted_items.append(self._python_to_secs(item))
                else:
                    converted_items.append(item)
            # Use appropriate array type
            if all(isinstance(v, str) for v in value):
                return Array(A, value)
            elif all(isinstance(v, int) for v in value):
                return Array(U4, value)
            else:
                # Mixed or unknown, use string array
                return Array(A, [str(v) for v in value])
        elif isinstance(value, dict):
            # Convert dict to list of key-value pairs
            items = []
            for k, v in value.items():
                items.append(str(k))
                items.append(v if not isinstance(v, (dict, list)) else str(v))
            return Array(A, items)
        elif isinstance(value, str):
            return A(value)
        elif isinstance(value, int):
            if value < 0:
                return I4(value)
            elif value <= 255:
                return U1(value)
            elif value <= 65535:
                return U2(value)
            else:
                return U4(value)
        elif isinstance(value, float):
            return F4(value)
        elif isinstance(value, bool):
            return Boolean(value)
        elif isinstance(value, bytes):
            return Binary(value)
        else:
            return A(str(value))

    def _secs_to_python(self, data: Any) -> Any:
        """Convert secsgem data item to Python type."""
        if hasattr(data, "__iter__") and not isinstance(data, (str, bytes)):
            return [self._secs_to_python(item) for item in data]
        elif hasattr(data, "get"):
            return data.get()
        else:
            return data

    def _body_to_sml(self, value: Any, indent: int = 2) -> str:
        """Convert body to SML format string."""
        prefix = " " * indent
        if isinstance(value, list):
            if not value:
                return f"{prefix}<L>"
            items = "\n".join(self._body_to_sml(v, indent + 2) for v in value)
            return f"{prefix}<L\n{items}\n{prefix}>"
        elif isinstance(value, dict):
            items = []
            for k, v in value.items():
                items.append(f'{" " * (indent + 2)}<A "{k}">')
                items.append(self._body_to_sml(v, indent + 2))
            return f"{prefix}<L\n" + "\n".join(items) + f"\n{prefix}>"
        elif isinstance(value, str):
            return f'{prefix}<A "{value}">'
        elif isinstance(value, int):
            return f"{prefix}<U4 {value}>"
        elif isinstance(value, float):
            return f"{prefix}<F4 {value}>"
        elif isinstance(value, bool):
            return f"{prefix}<BOOLEAN {value}>"
        else:
            return f'{prefix}<A "{value}">'

    def _build_message(self, stream: int, function: int, wbit: bool, secs_data: Any):
        """Build a SECS message from components.

        Uses secsgem's built-in function classes when available.
        For unsupported stream/function combinations, creates a generic wrapper.
        """
        import secsgem.secs.functions as functions
        from secsgem.secs import SecsStreamFunction

        # Try to find the specific function class (e.g., SecsS01F03)
        class_name = f'SecsS{stream:02d}F{function:02d}'

        if hasattr(functions, class_name):
            # Use the built-in class
            cls = getattr(functions, class_name)
            # Extract the actual value if secs_data has a get() method
            value = secs_data.get() if hasattr(secs_data, 'get') else secs_data
            return cls(value)
        else:
            # For unsupported stream/function, create a generic wrapper
            # This allows basic encoding but may not have full SECS-II compliance
            msg = SecsStreamFunction()
            msg.stream = stream
            msg.function = function
            msg.data = secs_data
            return msg

    def _parse_message(self, data: bytes):
        """Parse binary SECS message.

        Decodes our custom binary format and extracts stream, function, wbit, and body.

        Format:
            - Byte 0: Stream (bits 0-6) + W-bit (bit 7)
            - Byte 1: Function
            - Bytes 2+: secsgem-encoded body (if present)
        """
        if not data or len(data) < 2:
            # Empty or invalid message
            class ParsedMessage:
                def __init__(self):
                    self.stream = 0
                    self.function = 0
                    self.wbit = False
                    self.data = None
            return ParsedMessage()

        # Parse our custom header
        stream_byte = data[0]
        function_byte = data[1]

        # Extract stream and wbit from first byte
        wbit = bool(stream_byte & 0x80)  # Bit 7
        stream = stream_byte & 0x7F      # Bits 0-6

        function = function_byte

        # Extract the body (bytes 2+)
        body_data = data[2:] if len(data) > 2 else b""

        # Try to decode using secsgem
        from secsgem.secs import SecsStreamFunction
        import secsgem.secs.functions as functions

        # Try to find the specific function class
        class_name = f'SecsS{stream:02d}F{function:02d}'

        msg_data = None
        if body_data:
            # There's a body to decode
            if hasattr(functions, class_name):
                # Use the built-in class for proper decoding
                cls = getattr(functions, class_name)
                msg = cls()
                try:
                    msg.decode(body_data)
                    msg_data = msg
                except Exception:
                    # Decoding failed, keep data as None
                    msg_data = None
            else:
                # For unsupported stream/function, use generic parsing
                msg = SecsStreamFunction()
                msg.stream = stream
                msg.function = function
                try:
                    msg.decode(body_data)
                    msg_data = msg
                except Exception:
                    # Decoding failed, keep data as None
                    msg_data = None

        # Create result object
        class ParsedMessage:
            def __init__(self, stream, function, wbit, data):
                self.stream = stream
                self.function = function
                self.wbit = wbit
                self.data = data

        return ParsedMessage(stream, function, wbit, msg_data)
