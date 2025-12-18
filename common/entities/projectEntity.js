/**
 * Represents a project.
 * Has the following attributes
 *
 * _id: String - id of the project
 * name: String - name of the project
 * description: String - description of the project
 * ownerId: String - the id of the organisation that owns the project
 * creationDate: Date
 * lastUpdatedDate: Date
 * goalAmount: Number
 * currentAmount: Number
 * deadLine: Date
 * status: String [PendingApproval, Approved, Rejected, Closed]
 * categoryId: String
 */
const PROJECT_STATUS = {
    PENDING_APPROVAL: "PendingApproval",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    CLOSED: "Closed",
}


class ProjectEntity {
    constructor(_id, name, description, ownerId, creationDate, lastUpdatedDate, goalAmount, currentAmount, deadLine, status, categoryId) {
        this._id = _id;
        this.name = name;
        this.description = description;
        this.ownerId = ownerId;
        this.creationDate = creationDate;
        this.lastUpdatedDate = lastUpdatedDate;
        this.goalAmount = goalAmount;
        this.currentAmount = currentAmount;
        this.deadLine = deadLine;
        this.status = status;
        this.categoryId = categoryId;
    }

    static fromJson(data) {
        return new ProjectEntity(
            data._id,
            data.name,
            data.description,
            data.ownerId,
            data.creationDate,
            data.lastUpdatedDate,
            data.goalAmount,
            data.currentAmount,
            data.deadLine,
            data.status,
            data.categoryId,
        );
    }

    /**
     * Creates a new project
     * @param name : String
     * @param description : String
     * @param ownerId : String - id of owner user
     * @param goalAmount : Number - number in $?
     * @param currentAmount : Number - number in $?
     * @param deadLine : Date
     * @param categoryId : String | undefined - category id (optional)
     * @returns {ProjectEntity}
     */
    static createNew(name, description, ownerId, goalAmount, currentAmount, deadLine, categoryId = undefined) {
        return new ProjectEntity(
            undefined,
            name,
            description,
            ownerId,
            new Date(),
            new Date(),
            goalAmount,
            currentAmount,
            deadLine,
            PROJECT_STATUS.PENDING_APPROVAL,
            categoryId,
        );
    }
}

module.exports = { PROJECT_STATUS, ProjectEntity }