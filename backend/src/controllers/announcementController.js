import Announcement from '../models/Announcement.js';

/**
 * @desc    Get all active announcements
 * @route   GET /api/announcements
 * @access  Private
 */
export const getAnnouncements = async (req, res) => {
    try {
        const announcements = await Announcement.find({ isActive: true })
            .populate({
                path: 'createdBy',
                select: 'email staffRef',
                populate: { path: 'staffRef', select: 'name position' }
            })
            .sort({ createdAt: -1 })
            .limit(50); // Get latest 50
        res.json(announcements);
    } catch (error) {
        console.error('Error fetching announcements:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @desc    Get announcement by ID
 * @route   GET /api/announcements/:id
 * @access  Private
 */
export const getAnnouncementById = async (req, res) => {
    try {
        const announcement = await Announcement.findById(req.params.id)
            .populate({
                path: 'createdBy',
                select: 'email staffRef',
                populate: { path: 'staffRef', select: 'name position' }
            });

        if (!announcement) {
            return res.status(404).json({ message: 'Announcement not found' });
        }
        res.json(announcement);
    } catch (error) {
        console.error('Error fetching announcement:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @desc    Create a new announcement
 * @route   POST /api/announcements
 * @access  Private (Admin/SuperAdmin)
 */
export const createAnnouncement = async (req, res) => {
    try {
        const { title, message, type } = req.body;

        const announcement = await Announcement.create({
            title,
            message,
            type: type || 'normal',
            createdBy: req.user._id,
        });

        // Populate details for response
        const populatedAnnouncement = await Announcement.findById(announcement._id)
            .populate({
                path: 'createdBy',
                select: 'email staffRef',
                populate: { path: 'staffRef', select: 'name position' }
            });

        res.status(201).json(populatedAnnouncement);
    } catch (error) {
        console.error('Error creating announcement:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @desc    Update an announcement
 * @route   PUT /api/announcements/:id
 * @access  Private (Admin/SuperAdmin)
 */
export const updateAnnouncement = async (req, res) => {
    try {
        const { title, message, type, isActive } = req.body;

        const announcement = await Announcement.findById(req.params.id);

        if (!announcement) {
            return res.status(404).json({ message: 'Announcement not found' });
        }

        announcement.title = title || announcement.title;
        announcement.message = message || announcement.message;

        if (type) announcement.type = type;
        if (isActive !== undefined) announcement.isActive = isActive;

        await announcement.save();

        const updatedAnnouncement = await Announcement.findById(req.params.id)
            .populate({
                path: 'createdBy',
                select: 'email staffRef',
                populate: { path: 'staffRef', select: 'name position' }
            });

        res.json(updatedAnnouncement);
    } catch (error) {
        console.error('Error updating announcement:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @desc    Delete an announcement
 * @route   DELETE /api/announcements/:id
 * @access  Private (Admin/SuperAdmin)
 */
export const deleteAnnouncement = async (req, res) => {
    try {
        const announcement = await Announcement.findById(req.params.id);

        if (!announcement) {
            return res.status(404).json({ message: 'Announcement not found' });
        }

        await announcement.deleteOne();
        res.json({ message: 'Announcement removed' });
    } catch (error) {
        console.error('Error deleting announcement:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
