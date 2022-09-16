import { TodoItem, ResultToDoItem } from '../models/TodoItem';
// import { AttachmentUtils } from './attachmentUtils';
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import * as uuid from 'uuid'
import * as AWS from 'aws-sdk';
import * as AWSXRay from 'aws-xray-sdk'
import { TodosAccess } from '../dataLayer/todosAcess';

const todosAccess = new TodosAccess();
const bucketName = process.env.ATTACHMENT_S3_BUCKET
const XAWS = AWSXRay.captureAWS(AWS)
const s3 = new XAWS.S3({
    signatureVersion: 'v4'
})
const urlExpiration = process.env.SIGNED_URL_EXPIRATION
// TODO: Implement businessLogic
export const getTodosForUser = async (userId: String,limit: number,nextkey: object): Promise<ResultToDoItem> => {
    return todosAccess.getTodosForUser(userId, limit,nextkey);
}

export async function createTodo(
    createTodoRequest: CreateTodoRequest,
    userId: string
): Promise<TodoItem> {

    const todoId = uuid.v4()

    return await todosAccess.createTodosForUser({
        userId: userId,
        todoId: todoId,
        createdAt: new Date().toISOString(),
        name: createTodoRequest.name,
        dueDate: createTodoRequest.dueDate,
        done: false,
        attachmentUrl: ""
    })
}

export async function deleteTodo(todoId: string, userId: string) {
    // TODO: Implement validate todoItem exist in DB
    return await todosAccess.deleteTodosForUser(todoId, userId)
}

export async function updateTodo(updateTodoRequest: UpdateTodoRequest, todoId: string, userId: string) {
    return await todosAccess.updateTodosForUser(updateTodoRequest, userId, todoId)
}

export async function createAttachmentPresignedUrl(todoId: string, userId: string) {
    const imageId = uuid.v4();
    const imageUrl = `https://${bucketName}.s3.amazonaws.com/${imageId}`;
    await todosAccess.updateTodosImage(imageUrl, userId, todoId)
    const url = getUploadUrl(imageId)
    return url;
}

function getUploadUrl(imageId: string) {
    return s3.getSignedUrl('putObject', {
        Bucket: bucketName,
        Key: imageId,
        Expires: Number(urlExpiration)
    })
}


/**
 * Get value of the limit parameter.
 *
 * @param {Object} event HTTP event passed to a Lambda function
 *
 * @returns {number} parsed "limit" parameter
*/
export async function parseLimitParameter(event) {
    const limitStr = getQueryParameter(event, 'limit')
    if (!limitStr) {
        return undefined
    }

    const limit = parseInt(limitStr, 10)
    if (limit <= 0) {
        throw new Error('Limit should be positive')
    }

    return limit
}

/**
 * Get value of the limit parameter.
 *
 * @param {Object} event HTTP event passed to a Lambda function
 *
 * @returns {Object} parsed "nextKey" parameter
 */
export async function parseNextKeyParameter(event) {
    const nextKeyStr = getQueryParameter(event, 'nextKey');
    if (!nextKeyStr) {
        return undefined;
    }
    const uriDecoded = decodeURIComponent(nextKeyStr)
    return JSON.parse(uriDecoded);
}

/**
 * Get a query parameter or return "undefined"
 *
 * @param {Object} event HTTP event passed to a Lambda function
 * @param {string} name a name of a query parameter to return
 *
 * @returns {string} a value of a query parameter value or "undefined" if a parameter is not defined
 */
function getQueryParameter(event, name) {
    const queryParams = event.queryStringParameters
    if (!queryParams) {
        return undefined
    }

    return queryParams[name]
}

export function encodeNextKey(lastEvaluatedKey) {
    if (!lastEvaluatedKey) {
      return null
    }
  
    return encodeURIComponent(JSON.stringify(lastEvaluatedKey))
  }