const prisma = require('../config/db');

// Get all rooms
const getRooms = async (req, res) => {
    try {
        const rooms = await prisma.room.findMany({
            include: {
                seats: {
                    orderBy: [
                        { row: 'asc' },
                        { number: 'asc' }
                    ]
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({
            status: 'success',
            data: rooms
        });
    } catch (error) {
        console.error('getRooms error:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Create Room
const createRoom = async (req, res) => {
    try {
        const { name, rows, seatsPerRow } = req.body;

        if (!name || !rows || !seatsPerRow) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Transaction to create room and seats
        const result = await prisma.$transaction(async (prisma) => {
            const room = await prisma.room.create({
                data: { name, rows, seatsPerRow }
            });

            const seatsData = [];
            for (let r = 0; r < rows; r++) {
                const rowChar = String.fromCharCode(65 + r);
                for (let n = 1; n <= seatsPerRow; n++) {
                    seatsData.push({
                        roomId: room.id,
                        row: rowChar,
                        number: n,
                        isActive: true
                    });
                }
            }

            if (seatsData.length > 0) {
                await prisma.seat.createMany({ data: seatsData });
            }

            return prisma.room.findUnique({
                where: { id: room.id },
                include: { seats: true }
            });
        });

        res.status(201).json({ status: 'success', data: result });
    } catch (error) {
        console.error('createRoom error:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Toggle Room Status
const toggleRoomActive = async (req, res) => {
    try {
        const { id } = req.params;
        const room = await prisma.room.findUnique({ where: { id } });
        if (!room) return res.status(404).json({ message: 'Room not found' });

        const updatedRoom = await prisma.room.update({
            where: { id },
            data: { isActive: !room.isActive },
            include: { seats: true }
        });

        res.json({ status: 'success', data: updatedRoom });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Toggle Seat Status
const toggleSeatActive = async (req, res) => {
    try {
        const { roomId, seatId } = req.params;
        const seat = await prisma.seat.findUnique({ where: { id: seatId } });

        if (!seat) return res.status(404).json({ message: 'Seat not found' });

        const updatedSeat = await prisma.seat.update({
            where: { id: seatId },
            data: { isActive: !seat.isActive }
        });

        res.json({ status: 'success', data: updatedSeat });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Delete Room
const deleteRoom = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.room.delete({ where: { id } });
        res.json({ status: 'success', message: 'Room deleted' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Update Room (name only for simplicity)
const updateRoom = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        const updatedRoom = await prisma.room.update({
            where: { id },
            data: { name },
            include: { seats: true }
        });
        res.json({ status: 'success', data: updatedRoom });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
}

// Batch Update Seats
const updateRoomSeats = async (req, res) => {
    try {
        const { id: roomId } = req.params;
        const { seats } = req.body; // Array of { id, isActive }

        if (!seats || !Array.isArray(seats)) {
            return res.status(400).json({ message: 'Invalid seats data' });
        }

        console.log('Updating seats:', JSON.stringify(seats, null, 2));


        const result = await prisma.$transaction(
            seats.map(seat =>
                prisma.seat.update({
                    where: { id: seat.id }, // roomId is not needed/allowed in update unique where
                    data: { isActive: seat.isActive }
                })
            )
        );

        res.json({ status: 'success', data: result });
    } catch (error) {
        console.error('updateRoomSeats error:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

module.exports = {
    getRooms,
    createRoom,
    toggleRoomActive,
    toggleSeatActive,
    deleteRoom,
    updateRoom,
    updateRoomSeats
};
