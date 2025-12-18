const {Donation, DONATION_STATUS} = require("./dbInit");
const {sendLog, LOG_TYPE} = require("../../../common/utils/loggingUtils");
const {
    authenticateJWT,
    getUserFromHeader,
    isOwnerOrAdmin, validateParamSchema, validateBodySchema
} = require("../../../common/utils/authenticationUtils");
const { object, string, number } = require("yup");
require("dotenv").config();


const {RESPONSES} = require("../../../common/utils/responseUtils");

function useDonationsController(app) {
    // get all donations
    app.get("/", async (req, res) => {
        // TODO : filtering
        const donations = await Donation.find();
        res.status(200).json(donations);
    });

    app.get("/:donationId",
        validateParamSchema(object({
            donationId: string().required()
        })), async (req, res) => {
        const {donationId} = req.params;

        try {
            const donation = await Donation.findById(donationId);
            res.status(200).json(donation);

        } catch (e) {
            return RESPONSES.ENTITY_NOT_FOUND(res);
        }
    });

    /**
     * Creates a new donation
     * @param projectId : String
     * @param amount : Number - number in $?
     * @returns {DonationEntity}
     */
    app.post("/",
        validateBodySchema(object({
            projectId: string().required(),
            amount: number().min(0).required()
        })),
        authenticateJWT, async (req, res) => {
        const user = getUserFromHeader(req);
        const donation = {
            userId: user.userId,
            projectId: req.body.projectId,
            amount: req.body.amount,
            creationDate: Date.now(),
            paymentStatus: DONATION_STATUS.UNSETTLED
        }
        try {
            // if (!isOwnerOrAdmin(user, project.ownerId)) {
            //     return RESPONSES.PERMISSION_DENIED(res);
            // }
            const  newDonation= new Donation({...donation});
            await newDonation.save();
            // TODO(Get project and edit that project current amout + new donation)
            // try {
            //     const url = process.env.PROJECTS_SERVICE_URL + "/"+req.body.projectId;
            //     const projectRes = await fetch(url, {
            //         method: "GET",
            //         headers: { "Content-Type": "application/json", "Authorization": req.headers.authorization },
            //
            //     });
            //     if (!projectRes.ok) return res.status(401).json({ error: "Invalid credentials" });
            //     const project = await projectRes.json();
            //
            //     try {
            //         const url = process.env.PROJECTS_SERVICE_URL + "/" +req.body.projectId;
            //         const projectRes = await fetch(url, {
            //             method: "POST",
            //             headers: { "Content-Type": "application/json", "Authorization": req.headers.authorization },
            //             body: JSON.stringify(
            //                 {
            //                     name : project.name,
            //                     description : project.description,
            //                     goalAmount : project.goalAmount,
            //                     currentAmount : project.currentAmount,
            //                     deadLine : project.deadLine,
            //                     lastUpdatedDate : project.lastUpdatedDate,
            //                     categoryId : project.categoryId,
            //                     status : project.status,
            //                 }
            //             ),
            //         });
            //         if (!projectRes.ok) return res.status(401).json({ error: "Invalid credentials" });
            //     } catch (err) {
            //         res.status(500).json({ error: "POST Project in donation create failed" });
            //     }
            //
            // } catch (err) {
            //     res.status(500).json({ error: "GET Project in donation create failed", err });
            // }

            sendLog("Created new donation : " + newDonation._id.toString(), LOG_TYPE.INFO);
            res.status(200).send();
        } catch (e) {
            sendLog("Failed to create a donation : " + donation + "\n Failed with error : " + e, LOG_TYPE.ERROR);
            return RESPONSES.SAVE_FAILED(res);

        }
    });

    /**
     * Updates existing donation
     * @param paymentStatus : String
     */
    app.put("/:donationId", authenticateJWT, async (req, res) => {
        const {donationId} = req.params;
        const user = getUserFromHeader(req);

        try {
            const donation = await Donation.findById(donationId);

            if (!isOwnerOrAdmin(user)) {
                return RESPONSES.PERMISSION_DENIED(res);
            }
            donation.paymentStatus = req.body.paymentStatus;

            await donation.save();
            sendLog("Updated donation : " + donation._id.toString(), LOG_TYPE.INFO);
            res.status(200).send();
        } catch (e) {
            sendLog("Failed to save donation : " + donationId + "\n Failed with error : " + e, LOG_TYPE.ERROR);
            return RESPONSES.SAVE_FAILED(res);
        }
    });

    /**
     * Deletes donation
     * @param donationId : String
     * @param paymentStatus : String
     */
    app.delete("/:donationId", async (req, res) => {
        const {donationId} = req.params;
        const user = getUserFromHeader(req);

        if (!isOwnerOrAdmin(user)) {
            return RESPONSES.PERMISSION_DENIED(res);
        }
        try {
            const donation = await Donation.findById(donationId);

            if (!isOwnerOrAdmin(user)) {
                return RESPONSES.PERMISSION_DENIED(res);
            }
            donation.paymentStatus = req.body.paymentStatus;

            await donation.save();
            sendLog("Deleted donation : " + donation._id.toString(), LOG_TYPE.INFO);
            res.status(200).send();
        } catch (e) {
            sendLog("Failed to save donation : " + donationId + "\n Failed with error : " + e, LOG_TYPE.ERROR);
            return RESPONSES.SAVE_FAILED(res);
        }
    });

}

/**
 * Find donation
 * @param donationId
 * @returns {Promise<undefined|Donation>}
 */
async function getDonationById(donationId) {
    try {
        return await Donation.findById(donationId);
    } catch (e) {
        return undefined;
    }
}

module.exports = {useDonationsController, getDonationById};