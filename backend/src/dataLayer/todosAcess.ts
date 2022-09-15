import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate';

const XAWS = AWSXRay.captureAWS(AWS)
// TODO: Implement the dataLayer logic
export class TodosAccess {

    constructor(
        private readonly docClient: DocumentClient = createDynamoDBClient(),
        private readonly toDoTable = process.env.TODOS_TABLE) {
    }

    async getTodosForUser(userId: String): Promise<TodoItem[]> {
        const result = await this.docClient.query({
            TableName: this.toDoTable,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            }
        }).promise()
        const items = result.Items
        return items as TodoItem[];
    }

    async createTodosForUser(todoItem: TodoItem): Promise<TodoItem> {
        await this.docClient.put({
            TableName: this.toDoTable,
            Item: todoItem
        }).promise()

        return todoItem as TodoItem
    }

    async deleteTodosForUser(todoIds: String, userId: String) {
        return await this.docClient.delete({
            TableName: this.toDoTable,
            Key: {
                userId: userId,
                todoId: todoIds
            }
        }).promise();
    }

    async updateTodosForUser(todoUpdate: TodoUpdate, userId: String, todoIds: String) {
        const params = {
            TableName: this.toDoTable,
            Key: {
                userId: userId,
                todoId: todoIds
            },
            UpdateExpression: 'set done = :r',
            ExpressionAttributeValues: {
                ':r': todoUpdate.done,
            }
        }
        return await this.docClient.update(params).promise();
    }

    async updateTodosImage(imageUrl: String, userId: String, todoIds: String) {
        const params = {
            TableName: this.toDoTable,
            Key: {
                userId: userId,
                todoId: todoIds
            },
            UpdateExpression: 'set attachmentUrl = :r',
            ExpressionAttributeValues: {
                ':r': imageUrl,
            }
        }
        return await this.docClient.update(params).promise();
    }
}

function createDynamoDBClient() {
    if (process.env.IS_OFFLINE) {
        console.log('Creating a local DynamoDB instance')
        return new XAWS.DynamoDB.DocumentClient({
            region: 'localhost',
            endpoint: 'http://localhost:8000'
        })
    }

    return new XAWS.DynamoDB.DocumentClient()
}