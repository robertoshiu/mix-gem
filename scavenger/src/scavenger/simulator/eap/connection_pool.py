# scavenger/src/scavenger/simulator/eap/connection_pool.py
"""Connection pool for managing multiple EAP client connections."""
import asyncio
import logging
import uuid
from typing import Any

from scavenger.simulator.eap.client import EapClient

logger = logging.getLogger(__name__)


class ConnectionPool:
    """Manages multiple HSMS active client connections to equipment simulators.

    The pool maintains a collection of EapClient instances, each connected to
    a different equipment simulator. It provides methods for connecting/disconnecting
    all equipment, routing messages to specific equipment, and broadcasting messages
    to all connected equipment.
    """

    def __init__(
        self,
        t3: float = 45.0,
        t5: float = 10.0,
        t6: float = 5.0,
    ) -> None:
        """Initialize connection pool.

        Args:
            t3: Reply timeout (seconds) - passed to all clients
            t5: Connect separation timeout (seconds) - passed to all clients
            t6: Control transaction timeout (seconds) - passed to all clients
        """
        self._clients: dict[int, EapClient] = {}
        self._configs: dict[int, dict[str, Any]] = {}
        self._t3 = t3
        self._t5 = t5
        self._t6 = t6

    @property
    def equipment_count(self) -> int:
        """Get number of configured equipment."""
        return len(self._configs)

    @property
    def connected_count(self) -> int:
        """Get number of connected equipment."""
        return sum(1 for client in self._clients.values() if client.is_connected)

    def is_all_connected(self) -> bool:
        """Check if all configured equipment are connected."""
        if self.equipment_count == 0:
            return False
        return self.connected_count == self.equipment_count

    def add_equipment(
        self,
        equipment_id: int,
        host: str,
        port: int,
        device_id: int,
    ) -> None:
        """Add equipment configuration to pool.

        Args:
            equipment_id: Unique equipment identifier
            host: Equipment host address
            port: Equipment TCP port
            device_id: SECS device ID

        Raises:
            ValueError: If equipment_id already exists
        """
        if equipment_id in self._configs:
            raise ValueError(f"Equipment ID {equipment_id} already exists")

        self._configs[equipment_id] = {
            "host": host,
            "port": port,
            "device_id": device_id,
        }

        logger.info(f"Added equipment {equipment_id} ({host}:{port})")

    def remove_equipment(self, equipment_id: int) -> None:
        """Remove equipment from pool.

        Args:
            equipment_id: Equipment identifier to remove

        Note:
            If equipment is connected, it will be disconnected first.
            If equipment doesn't exist, no error is raised.
        """
        if equipment_id not in self._configs:
            logger.warning(f"Equipment ID {equipment_id} not found")
            return

        # Disconnect if connected
        if equipment_id in self._clients:
            client = self._clients[equipment_id]
            if client.is_connected:
                # Note: This is a synchronous method, so we can't await disconnect
                # In production, caller should disconnect before removing
                logger.warning(f"Equipment {equipment_id} is still connected, removing anyway")
            del self._clients[equipment_id]

        del self._configs[equipment_id]
        logger.info(f"Removed equipment {equipment_id}")

    async def connect_all(self) -> None:
        """Connect to all configured equipment.

        Connection failures are logged but do not raise exceptions.
        This allows partial connectivity where some equipment may be unavailable.
        """
        tasks = []
        for equipment_id in self._configs:
            tasks.append(self._connect_single(equipment_id))

        # Run all connection attempts concurrently
        await asyncio.gather(*tasks, return_exceptions=True)

        logger.info(
            f"Connected to {self.connected_count}/{self.equipment_count} equipment"
        )

    async def disconnect_all(self) -> None:
        """Disconnect from all equipment."""
        tasks = []
        for equipment_id, client in self._clients.items():
            if client.is_connected:
                tasks.append(self._disconnect_single(equipment_id))

        # Run all disconnection attempts concurrently
        await asyncio.gather(*tasks, return_exceptions=True)

        logger.info("Disconnected from all equipment")

    async def connect_equipment(self, equipment_id: int) -> None:
        """Connect to specific equipment.

        Args:
            equipment_id: Equipment identifier

        Raises:
            KeyError: If equipment_id not found
            Exception: If connection fails
        """
        if equipment_id not in self._configs:
            raise KeyError(f"Equipment ID {equipment_id} not found")

        await self._connect_single(equipment_id)

    async def disconnect_equipment(self, equipment_id: int) -> None:
        """Disconnect from specific equipment.

        Args:
            equipment_id: Equipment identifier

        Raises:
            KeyError: If equipment_id not found
        """
        if equipment_id not in self._configs:
            raise KeyError(f"Equipment ID {equipment_id} not found")

        await self._disconnect_single(equipment_id)

    async def send_to_equipment(
        self,
        equipment_id: int,
        stream: int,
        function: int,
        wbit: bool,
        body: Any = None,
    ) -> Any | None:
        """Send SECS message to specific equipment.

        Args:
            equipment_id: Equipment identifier
            stream: SECS stream number
            function: SECS function number
            wbit: Wait bit (True for request expecting reply)
            body: Message body (dict, list, or primitive)

        Returns:
            Reply message body if wbit=True, None otherwise

        Raises:
            KeyError: If equipment_id not found
            RuntimeError: If equipment is not connected
        """
        if equipment_id not in self._configs:
            raise KeyError(f"Equipment ID {equipment_id} not found")

        if equipment_id not in self._clients or not self._clients[equipment_id].is_connected:
            raise RuntimeError(f"Equipment ID {equipment_id} is not connected")

        client = self._clients[equipment_id]
        return await client.send_message(stream, function, wbit, body)

    async def broadcast(
        self,
        stream: int,
        function: int,
        wbit: bool,
        body: Any = None,
    ) -> dict[int, Any]:
        """Broadcast SECS message to all connected equipment.

        Args:
            stream: SECS stream number
            function: SECS function number
            wbit: Wait bit (True for request expecting reply)
            body: Message body (dict, list, or primitive)

        Returns:
            Dictionary mapping equipment_id to reply (or None if wbit=False)

        Note:
            Only sends to connected equipment. Disconnected equipment are skipped.
        """
        tasks = []
        equipment_ids = []

        for equipment_id, client in self._clients.items():
            if client.is_connected:
                equipment_ids.append(equipment_id)
                tasks.append(client.send_message(stream, function, wbit, body))

        # Send to all connected equipment concurrently
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Map results back to equipment IDs
        return dict(zip(equipment_ids, results))

    def get_equipment_status(self) -> dict[int, dict[str, Any]]:
        """Get connection status for all equipment.

        Returns:
            Dictionary mapping equipment_id to status info:
                - host: Equipment host
                - port: Equipment port
                - device_id: SECS device ID
                - connected: Connection status (bool)
        """
        status = {}
        for equipment_id, config in self._configs.items():
            is_connected = (
                equipment_id in self._clients
                and self._clients[equipment_id].is_connected
            )
            status[equipment_id] = {
                "host": config["host"],
                "port": config["port"],
                "device_id": config["device_id"],
                "connected": is_connected,
            }
        return status

    async def _connect_single(self, equipment_id: int) -> None:
        """Connect to a single equipment.

        Args:
            equipment_id: Equipment identifier

        Note:
            Logs errors but does not raise exceptions.
        """
        config = self._configs[equipment_id]

        try:
            # Create client if doesn't exist
            if equipment_id not in self._clients:
                client = EapClient(
                    host=config["host"],
                    port=config["port"],
                    device_id=config["device_id"],
                    session_id=uuid.uuid4(),
                    t3=self._t3,
                    t5=self._t5,
                    t6=self._t6,
                )
                self._clients[equipment_id] = client

            # Connect
            client = self._clients[equipment_id]
            if not client.is_connected:
                await client.connect()
                logger.info(
                    f"Connected to equipment {equipment_id} "
                    f"({config['host']}:{config['port']})"
                )

        except Exception as e:
            logger.error(
                f"Failed to connect to equipment {equipment_id} "
                f"({config['host']}:{config['port']}): {e}"
            )

    async def _disconnect_single(self, equipment_id: int) -> None:
        """Disconnect from a single equipment.

        Args:
            equipment_id: Equipment identifier

        Note:
            Logs errors but does not raise exceptions.
        """
        if equipment_id not in self._clients:
            return

        try:
            client = self._clients[equipment_id]
            if client.is_connected:
                await client.disconnect()
                logger.info(f"Disconnected from equipment {equipment_id}")

        except Exception as e:
            logger.error(f"Failed to disconnect from equipment {equipment_id}: {e}")
