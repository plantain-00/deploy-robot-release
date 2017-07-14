"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const libs = require("./libs");
const gitlabHost = "https://gitlab.com";
const privateToken = process.env.DEPLOY_ROBOT_PRIVATE_TOKEN;
function createComment(content, context) {
    const url = `${gitlabHost}/api/v3/projects/${context.projectId}/merge_requests/${context.mergeRequestId}/notes`;
    return new Promise((resolve, reject) => {
        libs.request({
            url,
            method: "post",
            json: true,
            body: {
                body: `@${context.author}, ${content}`,
            },
            headers: {
                "PRIVATE-TOKEN": privateToken,
            },
        }, (error, incomingMessage, body) => {
            if (error) {
                // tslint:disable-next-line:no-console
                console.log(error);
            }
            else if (incomingMessage.statusCode !== 201) {
                // tslint:disable-next-line:no-console
                console.log(body);
            }
            resolve();
        });
    });
}
exports.createComment = createComment;
function getRepositoryName(request) {
    return request.body.repository.name;
}
exports.getRepositoryName = getRepositoryName;
function verifySignature(request, application) {
    const token = request.header("X-Gitlab-Token");
    return token === application.hookSecret;
}
exports.verifySignature = verifySignature;
function getEventName(request) {
    return request.header("X-Gitlab-Event");
}
exports.getEventName = getEventName;
exports.commentEventName = "Note Hook";
exports.pullRequestEventName = "Merge Request Hook";
function getCommentAuthor(request) {
    return request.body.object_attributes.author_id;
}
exports.getCommentAuthor = getCommentAuthor;
function getPullRequestAuthor(request) {
    return request.body.object_attributes.author_id;
}
exports.getPullRequestAuthor = getPullRequestAuthor;
function getComment(request) {
    return request.body.object_attributes.note;
}
exports.getComment = getComment;
function getCommentCreationContext(request, application) {
    return {
        projectId: request.body.project_id,
        mergeRequestId: request.body.merge_request.id,
        author: getCommentAuthor(request),
    };
}
exports.getCommentCreationContext = getCommentCreationContext;
function getPullRequestCommentCreationContext(request, application) {
    return {
        projectId: request.body.project_id,
        mergeRequestId: request.body.merge_request.id,
        author: getPullRequestAuthor(request),
    };
}
exports.getPullRequestCommentCreationContext = getPullRequestCommentCreationContext;
function getPullRequestAction(request) {
    return request.body.object_attributes.action;
}
exports.getPullRequestAction = getPullRequestAction;
exports.pullRequestOpenActionName = "open";
exports.pullRequestUpdateActionName = "update";
function isPullRequestMerged(request, action) {
    return action === "merge";
}
exports.isPullRequestMerged = isPullRequestMerged;
function isPullRequestClosed(request, action) {
    return action === "close";
}
exports.isPullRequestClosed = isPullRequestClosed;
function getPullRequestId(request) {
    return request.body.object_attributes.id;
}
exports.getPullRequestId = getPullRequestId;
function getBranchName(request) {
    return request.body.object_attributes.source_branch;
}
exports.getBranchName = getBranchName;
function getHeadRepositoryCloneUrl(request) {
    return request.body.object_attributes.source.git_http_url;
}
exports.getHeadRepositoryCloneUrl = getHeadRepositoryCloneUrl;
