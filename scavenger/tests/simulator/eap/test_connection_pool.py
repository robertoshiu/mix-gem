# scavenger/tests/simulator/eap/test_connection_pool.py
"""Tests for HSMS connection pool (multi-equipment management)."""
import asyncio
import uuid

import pytest

from scavenger.simulator.eap.connection_pool import ConnectionPool
from scavenger.simulator.equipment.server import EquipmentServer


def test_connection_pool_init():
    """ConnectionPool initializes with empty equipment list."""
    pool = ConnectionPool()

    assert pool.equipment_count == 0
    assert pool.connected_count == 0
    assert pool.is_all_connected() is False


def test_add_equipment():
    """ConnectionPool can add equipment configuration."""
    pool = ConnectionPool()

    # Add first equipment
    pool.add_equipment(
        equipment_id=1,
        host="127.0.0.1",
        port=5000,
        device_id=1,
    )

    assert pool.equipment_count == 1

    # Add second equipment
    pool.add_equipment(
        equipment_id=2,
        host="127.0.0.1",
        port=5001,
        device_id=2,
    )

    assert pool.equipment_count == 2


def test_add_equipment_duplicate_id():
    """ConnectionPool rejects duplicate equipment IDs."""
    pool = ConnectionPool()

    pool.add_equipment(
        equipment_id=1,
        host="127.0.0.1",
        port=5000,
        device_id=1,
    )

    # Adding same equipment_id should raise ValueError
    with pytest.raises(ValueError, match="Equipment ID 1 already exists"):
        pool.add_equipment(
            equipment_id=1,
            host="127.0.0.1",
            port=5001,
            device_id=1,
        )


def test_remove_equipment():
    """ConnectionPool can remove equipment."""
    pool = ConnectionPool()

    pool.add_equipment(
        equipment_id=1,
        host="127.0.0.1",
        port=5000,
        device_id=1,
    )

    assert pool.equipment_count == 1

    pool.remove_equipment(equipment_id=1)

    assert pool.equipment_count == 0


def test_remove_nonexistent_equipment():
    """ConnectionPool handles removing nonexistent equipment gracefully."""
    pool = ConnectionPool()

    # Should not raise exception
    pool.remove_equipment(equipment_id=999)

    assert pool.equipment_count == 0


@pytest.mark.asyncio
async def test_connect_all():
    """ConnectionPool can connect to all configured equipment."""
    # Start two equipment servers
    server1 = EquipmentServer(
        equipment_id=1,
        host="127.0.0.1",
        port=16100,
        device_id=1,
    )
    server2 = EquipmentServer(
        equipment_id=2,
        host="127.0.0.1",
        port=16101,
        device_id=2,
    )

    await server1.start()
    await server2.start()

    try:
        pool = ConnectionPool()

        # Add equipment
        pool.add_equipment(
            equipment_id=1,
            host="127.0.0.1",
            port=16100,
            device_id=1,
        )
        pool.add_equipment(
            equipment_id=2,
            host="127.0.0.1",
            port=16101,
            device_id=2,
        )

        # Initially not connected
        assert pool.connected_count == 0
        assert pool.is_all_connected() is False

        # Connect all
        await pool.connect_all()

        # All should be connected
        assert pool.connected_count == 2
        assert pool.is_all_connected() is True

        # Cleanup
        await pool.disconnect_all()

    finally:
        await server1.stop()
        await server2.stop()


@pytest.mark.asyncio
async def test_disconnect_all():
    """ConnectionPool can disconnect from all equipment."""
    # Start equipment server
    server = EquipmentServer(
        equipment_id=1,
        host="127.0.0.1",
        port=16102,
        device_id=1,
    )
    await server.start()

    try:
        pool = ConnectionPool()

        pool.add_equipment(
            equipment_id=1,
            host="127.0.0.1",
            port=16102,
            device_id=1,
        )

        await pool.connect_all()
        assert pool.connected_count == 1

        # Disconnect all
        await pool.disconnect_all()

        assert pool.connected_count == 0
        assert pool.is_all_connected() is False

    finally:
        await server.stop()


@pytest.mark.asyncio
async def test_connect_equipment():
    """ConnectionPool can connect to specific equipment."""
    server = EquipmentServer(
        equipment_id=1,
        host="127.0.0.1",
        port=16103,
        device_id=1,
    )
    await server.start()

    try:
        pool = ConnectionPool()

        pool.add_equipment(
            equipment_id=1,
            host="127.0.0.1",
            port=16103,
            device_id=1,
        )

        # Initially not connected
        status = pool.get_equipment_status()
        assert status[1]["connected"] is False

        # Connect specific equipment
        await pool.connect_equipment(equipment_id=1)

        # Should be connected now
        status = pool.get_equipment_status()
        assert status[1]["connected"] is True
        assert pool.connected_count == 1

        await pool.disconnect_all()

    finally:
        await server.stop()


@pytest.mark.asyncio
async def test_disconnect_equipment():
    """ConnectionPool can disconnect from specific equipment."""
    server = EquipmentServer(
        equipment_id=1,
        host="127.0.0.1",
        port=16104,
        device_id=1,
    )
    await server.start()

    try:
        pool = ConnectionPool()

        pool.add_equipment(
            equipment_id=1,
            host="127.0.0.1",
            port=16104,
            device_id=1,
        )

        await pool.connect_equipment(equipment_id=1)
        assert pool.connected_count == 1

        # Disconnect specific equipment
        await pool.disconnect_equipment(equipment_id=1)

        assert pool.connected_count == 0
        status = pool.get_equipment_status()
        assert status[1]["connected"] is False

    finally:
        await server.stop()


@pytest.mark.asyncio
async def test_send_to_equipment():
    """ConnectionPool can send message to specific equipment."""
    server = EquipmentServer(
        equipment_id=1,
        host="127.0.0.1",
        port=16105,
        device_id=1,
    )
    await server.start()

    try:
        pool = ConnectionPool()

        pool.add_equipment(
            equipment_id=1,
            host="127.0.0.1",
            port=16105,
            device_id=1,
        )

        await pool.connect_equipment(equipment_id=1)

        # Send S1F1 (Are You There) to equipment 1
        # In skeleton mode, this won't get a reply, but should not raise exception
        reply = await pool.send_to_equipment(
            equipment_id=1,
            stream=1,
            function=1,
            wbit=False,
            body=None,
        )

        # Verify no exception in skeleton mode
        assert reply is None

        await pool.disconnect_all()

    finally:
        await server.stop()


@pytest.mark.asyncio
async def test_send_to_nonexistent_equipment():
    """ConnectionPool raises error when sending to nonexistent equipment."""
    pool = ConnectionPool()

    with pytest.raises(KeyError, match="Equipment ID 999 not found"):
        await pool.send_to_equipment(
            equipment_id=999,
            stream=1,
            function=1,
            wbit=False,
            body=None,
        )


@pytest.mark.asyncio
async def test_send_to_disconnected_equipment():
    """ConnectionPool raises error when sending to disconnected equipment."""
    pool = ConnectionPool()

    pool.add_equipment(
        equipment_id=1,
        host="127.0.0.1",
        port=5000,
        device_id=1,
    )

    # Equipment exists but not connected
    with pytest.raises(RuntimeError, match="Equipment ID 1 is not connected"):
        await pool.send_to_equipment(
            equipment_id=1,
            stream=1,
            function=1,
            wbit=False,
            body=None,
        )


@pytest.mark.asyncio
async def test_broadcast_message():
    """ConnectionPool can broadcast message to all connected equipment."""
    # Start two equipment servers
    server1 = EquipmentServer(
        equipment_id=1,
        host="127.0.0.1",
        port=16106,
        device_id=1,
    )
    server2 = EquipmentServer(
        equipment_id=2,
        host="127.0.0.1",
        port=16107,
        device_id=2,
    )

    await server1.start()
    await server2.start()

    try:
        pool = ConnectionPool()

        pool.add_equipment(
            equipment_id=1,
            host="127.0.0.1",
            port=16106,
            device_id=1,
        )
        pool.add_equipment(
            equipment_id=2,
            host="127.0.0.1",
            port=16107,
            device_id=2,
        )

        await pool.connect_all()

        # Broadcast S1F1 to all equipment
        # In skeleton mode, this won't get replies, but should not raise exception
        results = await pool.broadcast(
            stream=1,
            function=1,
            wbit=False,
            body=None,
        )

        # Should have results for both equipment
        assert len(results) == 2
        assert 1 in results
        assert 2 in results

        await pool.disconnect_all()

    finally:
        await server1.stop()
        await server2.stop()


@pytest.mark.asyncio
async def test_broadcast_with_partial_connection():
    """ConnectionPool broadcasts only to connected equipment."""
    # Start only one server (equipment 1)
    server1 = EquipmentServer(
        equipment_id=1,
        host="127.0.0.1",
        port=16108,
        device_id=1,
    )
    await server1.start()

    try:
        pool = ConnectionPool()

        # Add two equipment, but only connect to one
        pool.add_equipment(
            equipment_id=1,
            host="127.0.0.1",
            port=16108,
            device_id=1,
        )
        pool.add_equipment(
            equipment_id=2,
            host="127.0.0.1",
            port=16109,  # No server running on this port
            device_id=2,
        )

        # Connect only equipment 1
        await pool.connect_equipment(equipment_id=1)

        # Broadcast should only send to connected equipment (equipment 1)
        results = await pool.broadcast(
            stream=1,
            function=1,
            wbit=False,
            body=None,
        )

        # Should only have result for equipment 1
        assert len(results) == 1
        assert 1 in results
        assert 2 not in results

        await pool.disconnect_all()

    finally:
        await server1.stop()


def test_get_equipment_status():
    """ConnectionPool returns status for all equipment."""
    pool = ConnectionPool()

    pool.add_equipment(
        equipment_id=1,
        host="127.0.0.1",
        port=5000,
        device_id=1,
    )
    pool.add_equipment(
        equipment_id=2,
        host="127.0.0.1",
        port=5001,
        device_id=2,
    )

    status = pool.get_equipment_status()

    assert len(status) == 2
    assert 1 in status
    assert 2 in status

    # Verify status structure
    assert "host" in status[1]
    assert "port" in status[1]
    assert "device_id" in status[1]
    assert "connected" in status[1]

    assert status[1]["host"] == "127.0.0.1"
    assert status[1]["port"] == 5000
    assert status[1]["device_id"] == 1
    assert status[1]["connected"] is False


@pytest.mark.asyncio
async def test_connect_all_with_failure():
    """ConnectionPool handles connection failures gracefully."""
    # Start only one server (equipment 1)
    server1 = EquipmentServer(
        equipment_id=1,
        host="127.0.0.1",
        port=16110,
        device_id=1,
    )
    await server1.start()

    try:
        pool = ConnectionPool()

        # Add two equipment
        pool.add_equipment(
            equipment_id=1,
            host="127.0.0.1",
            port=16110,
            device_id=1,
        )
        pool.add_equipment(
            equipment_id=2,
            host="127.0.0.1",
            port=16111,  # No server running
            device_id=2,
        )

        # Connect all (should not raise exception, just log errors)
        await pool.connect_all()

        # Equipment 1 should be connected, equipment 2 should not
        assert pool.connected_count == 1
        assert pool.is_all_connected() is False

        status = pool.get_equipment_status()
        assert status[1]["connected"] is True
        assert status[2]["connected"] is False

        await pool.disconnect_all()

    finally:
        await server1.stop()


@pytest.mark.asyncio
async def test_connection_pool_with_custom_timers():
    """ConnectionPool can create clients with custom timer settings."""
    server = EquipmentServer(
        equipment_id=1,
        host="127.0.0.1",
        port=16112,
        device_id=1,
    )
    await server.start()

    try:
        pool = ConnectionPool(
            t3=30.0,
            t5=15.0,
            t6=8.0,
        )

        pool.add_equipment(
            equipment_id=1,
            host="127.0.0.1",
            port=16112,
            device_id=1,
        )

        await pool.connect_equipment(equipment_id=1)

        # Verify client was created with custom timers
        # (we can't access internal _clients directly in tests, but connection should work)
        assert pool.connected_count == 1

        await pool.disconnect_all()

    finally:
        await server.stop()
