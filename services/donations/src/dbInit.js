const mongoose = require('mongoose');
const DONATION_STATUS = {
    PAID: "Paid",
    UNSETTLED: "Unsettled",
    FAILED: "Failed",
}

// MongoDB connection
mongoose.connect('mongodb://donations-db:27017/donations', {});

// Donation
const DonationSchema = new mongoose.Schema({
        userId: {type: String, required: true},
        projectId: {type: String, required: true},
        amount: {type: Number, required: true},
        creationDate: {type: Date, required: true},
        paymentStatus: {
            type: String, enum:
                [...Object.values(DONATION_STATUS)], required:
                true
        },
    })
;
const Donation = mongoose.model("Donation", DonationSchema);

module.exports = {
    DonationSchema,
    Donation,
    DONATION_STATUS
}