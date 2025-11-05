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


class Project {
    constructor(_id, name, description, ownerId, creationDate, lastUpdatedDate, goalAmount, deadLine, status, categoryId) {
        this._id = _id;
        this.name = name;
        this.description = description;
        this.ownerId = ownerId;
        this.creationDate = creationDate;
        this.lastUpdatedDate = lastUpdatedDate;
        this.goalAmount = goalAmount;
        this.deadLine = deadLine;
        this.status = status;
        this.categoryId = categoryId;
    }

    static fromJson(data) {
        return new Project(
            data._id,
            data.name,
            data.description,
            data.ownerId,
            data.creationDate,
            data.lastUpdatedDate,
            data.goalAmount,
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
     * @param deadLine : Date
     * @param categoryId : String | undefined - category id (optional)
     * @returns {Project}
     */
    static createNew(name, description, ownerId, goalAmount, deadLine, categoryId = undefined) {
        return new Project(
            undefined,
            name,
            description,
            ownerId,
            new Date(),
            new Date(),
            goalAmount,
            deadLine,
            PROJECT_STATUS.PENDING_APPROVAL,
            categoryId,
        );
    }
}