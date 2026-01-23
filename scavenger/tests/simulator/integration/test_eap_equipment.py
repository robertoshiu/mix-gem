"""Integration tests for EAP client and Equipment server communication.

These tests verify end-to-end communication between EAP clients and Equipment servers.
They require actual TCP connections and test the full integration stack.

NOTE: These tests use skeleton implementations that log messages instead of performing
full HSMS encoding/decoding. They verify the architecture and API contracts work correctly.
"""
import asyncio
import uuid
from datetime import datetime

import pytest

from scavenger.runtime.connection import ConnectionState
from scavenger.simulator.eap.client import EapClient
from scavenger.simulator.eap.connection_pool import ConnectionPool
from scavenger.simulator.eap.transactions import TransactionTracker
from scavenger.simulator.equipment.server import EquipmentServer
from scavenger.simulator.equipment.state import ProcessState, VariableType


@pytest.mark.integration
@pytest.mark.asyncio
async def test_eap_connects_to_equipment():
    """Test EAP client connecting to EquipmentServer.

    Verifies:
    - Equipment server can start and listen
    - EAP client can connect to equipment
    - Connection state tracking works
    - Clean disconnect and cleanup
    """
    # Start EquipmentServer on unique port
    server = EquipmentServer(
        equipment_id=1,
        host="127.0.0.1",
        port=15100,
        device_id=1,
    )
    await server.start()

    try:
        assert server.is_running is True

        # Create EapClient
        client = EapClient(
            host="127.0.0.1",
            port=15100,
            device_id=0,
            session_id=uuid.uuid4(),
        )

        # Verify initial state
        assert client.is_connected is False
        assert client.connection_state == ConnectionState.NOT_CONNECTED

        # Connect to equipment
        await client.connect()

        # Verify connected state
        assert client.is_connected is True
        assert client.connection_state == ConnectionState.CONNECTED

        # Disconnect
        await client.disconnect()

        # Verify disconnected state
        assert client.is_connected is False
        assert client.connection_state == ConnectionState.NOT_CONNECTED

    finally:
        await server.stop()
        assert server.is_running is False


@pytest.mark.integration
@pytest.mark.asyncio
async def test_eap_sends_s1f1():
    """Test sending S1F1 (Are You There) to equipment.

    Verifies:
    - EAP client can send SECS messages
    - Message structure is created correctly
    - Transaction tracking is initialized
    - No exceptions in skeleton mode
    """
    server = EquipmentServer(
        equipment_id=1,
        host="127.0.0.1",
        port=15101,
        device_id=1,
    )
    await server.start()

    try:
        client = EapClient(
            host="127.0.0.1",
            port=15101,
            device_id=0,
            session_id=uuid.uuid4(),
        )
        await client.connect()

        try:
            # Send S1F1 without waiting for reply (skeleton mode)
            reply = await client.send_message(
                stream=1,
                function=1,
                wbit=False,  # Don't wait for reply in skeleton mode
                body=None,
            )

            # In skeleton mode, no reply expected
            assert reply is None

            # Verify transaction was tracked
            assert len(client._transactions) > 0

            # Verify transaction has correct structure
            tx_id = list(client._transactions.keys())[0]
            ctx = client._transactions[tx_id]
            assert ctx.transaction_id == tx_id
            assert ctx.request is not None
            assert ctx.request.data.stream == 1
            assert ctx.request.data.function == 1
            assert ctx.sent_at is not None

        finally:
            await client.disconnect()

    finally:
        await server.stop()


@pytest.mark.integration
@pytest.mark.asyncio
async def test_eap_establishes_communication():
    """Test S1F13/S1F14 (Establish Communication) exchange.

    Verifies:
    - Client can send SELECT.req to establish HSMS session
    - State transitions work (CONNECTED -> SELECTED)
    - Communication establishment workflow
    """
    server = EquipmentServer(
        equipment_id=1,
        host="127.0.0.1",
        port=15102,
        device_id=1,
    )
    await server.start()

    try:
        client = EapClient(
            host="127.0.0.1",
            port=15102,
            device_id=0,
            session_id=uuid.uuid4(),
        )
        await client.connect()

        try:
            # Initial state should be CONNECTED
            assert client.connection_state == ConnectionState.CONNECTED

            # Send SELECT.req to establish communication
            await client.send_select()

            # State should transition to SELECTED
            assert client.connection_state == ConnectionState.SELECTED

            # Now send S1F13 (Establish Communication Request)
            # In skeleton mode, just verify no exception
            await client.send_message(
                stream=1,
                function=13,
                wbit=False,
                body={"MDLN": "TEST_EQUIPMENT", "SOFTREV": "1.0.0"},
            )

            # Verify message was tracked
            assert len(client._transactions) > 0

        finally:
            await client.disconnect()

    finally:
        await server.stop()


@pytest.mark.integration
@pytest.mark.asyncio
async def test_eap_requests_status_variables():
    """Test S1F3/S1F4 (Status Variable Request/Data) exchange.

    Verifies:
    - Equipment state can be configured with status variables
    - Client can request status variables
    - Equipment state is accessible
    """
    server = EquipmentServer(
        equipment_id=1,
        host="127.0.0.1",
        port=15103,
        device_id=1,
    )

    # Configure equipment state with test data
    state = server.get_state()
    state.set_variable(VariableType.SV, 1, "IDLE")  # Process state
    state.set_variable(VariableType.SV, 2, 25.5)    # Temperature
    state.set_variable(VariableType.SV, 3, 1013.25) # Pressure

    await server.start()

    try:
        client = EapClient(
            host="127.0.0.1",
            port=15103,
            device_id=0,
            session_id=uuid.uuid4(),
        )
        await client.connect()

        try:
            # Request status variables (S1F3)
            # In skeleton mode, we just send the request
            await client.send_message(
                stream=1,
                function=3,
                wbit=False,
                body={"SVID": [1, 2, 3]},
            )

            # Verify equipment state has the values
            assert state.get_variable(VariableType.SV, 1) == "IDLE"
            assert state.get_variable(VariableType.SV, 2) == 25.5
            assert state.get_variable(VariableType.SV, 3) == 1013.25

            # Verify message was sent and tracked
            assert len(client._transactions) > 0

        finally:
            await client.disconnect()

    finally:
        await server.stop()


@pytest.mark.integration
@pytest.mark.asyncio
async def test_connection_pool_with_equipment():
    """Test ConnectionPool managing multiple equipment connections.

    Verifies:
    - ConnectionPool can manage multiple equipment servers
    - Concurrent connections work correctly
    - Status tracking across multiple connections
    - Broadcast to all equipment
    """
    # Start multiple equipment servers
    servers = []
    for i in range(3):
        server = EquipmentServer(
            equipment_id=i + 1,
            host="127.0.0.1",
            port=15104 + i,
            device_id=i + 1,
        )
        await server.start()
        servers.append(server)

    try:
        # Create connection pool
        pool = ConnectionPool(t3=30.0, t5=10.0, t6=5.0)

        # Add all equipment to pool
        for i in range(3):
            pool.add_equipment(
                equipment_id=i + 1,
                host="127.0.0.1",
                port=15104 + i,
                device_id=i + 1,
            )

        # Verify equipment count
        assert pool.equipment_count == 3
        assert pool.connected_count == 0
        assert pool.is_all_connected() is False

        # Connect to all equipment
        await pool.connect_all()

        # Verify all connected
        assert pool.connected_count == 3
        assert pool.is_all_connected() is True

        # Get status for all equipment
        status = pool.get_equipment_status()
        assert len(status) == 3
        for i in range(3):
            equip_id = i + 1
            assert status[equip_id]["connected"] is True
            assert status[equip_id]["host"] == "127.0.0.1"
            assert status[equip_id]["port"] == 15104 + i

        # Send message to specific equipment
        await pool.send_to_equipment(
            equipment_id=1,
            stream=1,
            function=1,
            wbit=False,
            body=None,
        )

        # Broadcast to all equipment
        results = await pool.broadcast(
            stream=1,
            function=1,
            wbit=False,
            body=None,
        )

        # Verify broadcast reached all equipment
        assert len(results) == 3
        for equip_id in [1, 2, 3]:
            assert equip_id in results

        # Disconnect all
        await pool.disconnect_all()

        # Verify all disconnected
        assert pool.connected_count == 0

    finally:
        # Cleanup servers
        for server in servers:
            await server.stop()


@pytest.mark.integration
@pytest.mark.asyncio
async def test_transaction_tracking_integration():
    """Test TransactionTracker with real message exchanges.

    Verifies:
    - Transaction tracker integrates with actual messages
    - Latency calculation works
    - Transaction state management
    - Statistics calculation
    """
    server = EquipmentServer(
        equipment_id=1,
        host="127.0.0.1",
        port=15107,
        device_id=1,
    )
    await server.start()

    try:
        client = EapClient(
            host="127.0.0.1",
            port=15107,
            device_id=0,
            session_id=uuid.uuid4(),
        )
        await client.connect()

        try:
            # Create transaction tracker
            tracker = TransactionTracker(timeout_seconds=30.0)

            # Send multiple messages and track them
            for i in range(5):
                # Send message
                await client.send_message(
                    stream=1,
                    function=1,
                    wbit=False,
                    body=None,
                )

                # Get the transaction from client
                tx_id = list(client._transactions.keys())[-1]
                ctx = client._transactions[tx_id]

                # Track in transaction tracker
                tracker.start_transaction(
                    equipment_id="equip_1",
                    transaction_id=tx_id,
                    request=ctx.request,
                )

                # Small delay between messages
                await asyncio.sleep(0.01)

            # Verify transactions were tracked
            assert tracker.total_pending == 5
            assert tracker.total_completed == 0

            # Get pending transactions
            pending = tracker.get_pending_transactions(equipment_id="equip_1")
            assert len(pending) == 5

            # Verify all are for the correct equipment
            for ctx in pending:
                assert ctx.request.data.stream == 1
                assert ctx.request.data.function == 1
                assert ctx.sent_at is not None

            # Get statistics
            stats = tracker.get_statistics(equipment_id="equip_1")
            assert stats["total_sent"] == 5
            assert stats["total_completed"] == 0
            assert stats["total_timeouts"] == 0
            assert stats["avg_latency_ms"] is None  # No completed yet

            # Simulate completing a transaction (manually for skeleton mode)
            tx_to_complete = pending[0]
            from scavenger.simulator.common.messages import HsmsMessage, HsmsMessageType, SecsMessageData

            # Create mock reply
            reply_data = SecsMessageData(
                stream=1,
                function=2,
                wbit=False,
                body=None,
            )
            reply_msg = HsmsMessage(
                session_id=client.session_id,
                timestamp=datetime.now(),
                direction="E2H",
                message_type=HsmsMessageType.DATA_MESSAGE,
                data=reply_data,
                sequence_num=1,
                transaction_id=tx_to_complete.transaction_id,
            )

            # Complete the transaction
            completed_ctx = tracker.complete_transaction(
                equipment_id="equip_1",
                transaction_id=tx_to_complete.transaction_id,
                reply=reply_msg,
            )

            # Verify completion
            assert completed_ctx is not None
            assert completed_ctx.reply is not None
            assert completed_ctx.received_at is not None
            assert completed_ctx.latency_ms is not None
            assert completed_ctx.latency_ms > 0

            # Check updated statistics
            stats = tracker.get_statistics(equipment_id="equip_1")
            assert stats["total_sent"] == 5
            assert stats["total_completed"] == 1
            assert stats["avg_latency_ms"] is not None
            assert stats["avg_latency_ms"] > 0

        finally:
            await client.disconnect()

    finally:
        await server.stop()


@pytest.mark.integration
@pytest.mark.asyncio
async def test_multiple_clients_single_server():
    """Test multiple EAP clients connecting to single equipment.

    Verifies:
    - Server can handle multiple concurrent clients
    - Each client maintains independent state
    - Concurrent message sending works
    """
    server = EquipmentServer(
        equipment_id=1,
        host="127.0.0.1",
        port=15108,
        device_id=1,
    )
    await server.start()

    try:
        # Create multiple clients
        clients = []
        for i in range(3):
            client = EapClient(
                host="127.0.0.1",
                port=15108,
                device_id=i,
                session_id=uuid.uuid4(),
            )
            await client.connect()
            clients.append(client)

        try:
            # Verify all clients connected
            for client in clients:
                assert client.is_connected is True

            # Send messages from all clients concurrently
            tasks = []
            for client in clients:
                task = client.send_message(
                    stream=1,
                    function=1,
                    wbit=False,
                    body=None,
                )
                tasks.append(task)

            # Wait for all messages to be sent
            await asyncio.gather(*tasks)

            # Verify all clients still connected
            for client in clients:
                assert client.is_connected is True
                assert len(client._transactions) > 0

        finally:
            # Disconnect all clients
            for client in clients:
                await client.disconnect()

    finally:
        await server.stop()


@pytest.mark.integration
@pytest.mark.asyncio
async def test_equipment_state_integration():
    """Test equipment state integration with message handling.

    Verifies:
    - Equipment state can be modified while server running
    - State changes are visible to clients
    - Different variable types work correctly
    - Process state tracking
    """
    server = EquipmentServer(
        equipment_id=1,
        host="127.0.0.1",
        port=15109,
        device_id=1,
    )

    state = server.get_state()

    # Set initial state
    state.process_state = ProcessState.IDLE
    state.control_state = "OFFLINE"
    state.set_variable(VariableType.SV, 100, "READY")
    state.set_variable(VariableType.DV, 200, 42.5)
    state.set_variable(VariableType.ECV, 300, "PARAM_VALUE")

    await server.start()

    try:
        client = EapClient(
            host="127.0.0.1",
            port=15109,
            device_id=0,
            session_id=uuid.uuid4(),
        )
        await client.connect()

        try:
            # Verify initial state
            assert state.process_state == ProcessState.IDLE
            assert state.control_state == "OFFLINE"

            # Modify state while connected
            state.process_state = ProcessState.EXECUTING
            state.control_state = "ONLINE_REMOTE"
            state.set_variable(VariableType.SV, 100, "EXECUTING")

            # Verify changes
            assert state.process_state == ProcessState.EXECUTING
            assert state.control_state == "ONLINE_REMOTE"
            assert state.get_variable(VariableType.SV, 100) == "EXECUTING"

            # Test get_variables (multiple at once)
            values = state.get_variables(VariableType.SV, [100])
            assert values == ["EXECUTING"]

            # Test state serialization
            state_dict = state.to_dict()
            assert state_dict["equipment_id"] == 1
            assert state_dict["process_state"] == "EXECUTING"
            assert state_dict["control_state"] == "ONLINE_REMOTE"
            assert state_dict["svs"][100] == "EXECUTING"

        finally:
            await client.disconnect()

    finally:
        await server.stop()


@pytest.mark.integration
@pytest.mark.asyncio
async def test_connection_pool_partial_connectivity():
    """Test ConnectionPool handling when some equipment are unavailable.

    Verifies:
    - Pool handles partial connectivity gracefully
    - Failed connections don't block successful ones
    - Status reporting shows mixed state
    """
    # Start only 2 out of 3 servers
    servers = []
    for i in range(2):
        server = EquipmentServer(
            equipment_id=i + 1,
            host="127.0.0.1",
            port=15110 + i,
            device_id=i + 1,
        )
        await server.start()
        servers.append(server)

    try:
        pool = ConnectionPool()

        # Add 3 equipment (but only 2 are running)
        pool.add_equipment(1, "127.0.0.1", 15110, 1)
        pool.add_equipment(2, "127.0.0.1", 15111, 2)
        pool.add_equipment(3, "127.0.0.1", 15112, 3)  # Not running

        # Try to connect all (should handle failure gracefully)
        await pool.connect_all()

        # Verify partial connectivity
        assert pool.equipment_count == 3
        assert pool.connected_count == 2  # Only 2 should connect
        assert pool.is_all_connected() is False

        # Check status
        status = pool.get_equipment_status()
        assert status[1]["connected"] is True
        assert status[2]["connected"] is True
        assert status[3]["connected"] is False

        # Broadcast should only reach connected equipment
        results = await pool.broadcast(1, 1, False, None)
        assert len(results) == 2
        assert 1 in results
        assert 2 in results
        assert 3 not in results

        # Disconnect all
        await pool.disconnect_all()

    finally:
        for server in servers:
            await server.stop()


@pytest.mark.integration
@pytest.mark.asyncio
async def test_linktest_integration():
    """Test HSMS LINKTEST message integration.

    Verifies:
    - Client can send LINKTEST.req
    - Connection stays alive after LINKTEST
    - Multiple LINKTESTs can be sent
    """
    server = EquipmentServer(
        equipment_id=1,
        host="127.0.0.1",
        port=15113,
        device_id=1,
    )
    await server.start()

    try:
        client = EapClient(
            host="127.0.0.1",
            port=15113,
            device_id=0,
            session_id=uuid.uuid4(),
        )
        await client.connect()

        try:
            # Send multiple LINKTEST requests
            for _ in range(3):
                await client.send_linktest()
                assert client.is_connected is True
                await asyncio.sleep(0.01)

            # Connection should still be alive
            assert client.is_connected is True
            assert client.connection_state == ConnectionState.CONNECTED

        finally:
            await client.disconnect()

    finally:
        await server.stop()


@pytest.mark.integration
@pytest.mark.asyncio
async def test_alarm_injection_integration():
    """Test alarm injection and state tracking.

    Verifies:
    - Alarms can be injected into running server
    - Alarm state is tracked correctly
    - Multiple alarms can be active
    """
    server = EquipmentServer(
        equipment_id=1,
        host="127.0.0.1",
        port=15114,
        device_id=1,
    )
    await server.start()

    try:
        client = EapClient(
            host="127.0.0.1",
            port=15114,
            device_id=0,
            session_id=uuid.uuid4(),
        )
        await client.connect()

        try:
            state = server.get_state()

            # Inject alarms
            await server.inject_alarm(alid=1001, alcd=2, altx="High temperature")
            await server.inject_alarm(alid=1002, alcd=3, altx="Low pressure")

            # Verify alarms are set
            alarm1 = state.get_alarm(1001)
            alarm2 = state.get_alarm(1002)

            assert alarm1 is not None
            assert alarm1.is_set is True
            assert alarm1.alcd == 2
            assert alarm1.altx == "High temperature"

            assert alarm2 is not None
            assert alarm2.is_set is True
            assert alarm2.alcd == 3
            assert alarm2.altx == "Low pressure"

            # Get all set alarms
            set_alarms = state.get_set_alarms()
            assert len(set_alarms) == 2

            # Clear one alarm
            state.clear_alarm(1001)
            assert state.get_alarm(1001).is_set is False

            # Verify only one alarm is set now
            set_alarms = state.get_set_alarms()
            assert len(set_alarms) == 1

        finally:
            await client.disconnect()

    finally:
        await server.stop()
