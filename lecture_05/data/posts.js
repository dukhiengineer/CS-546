import {posts} from '../config/mongoCollections.js';
import userData from './users.js';
import {ObjectId} from 'mongodb';
import validation from './validation.js';

const exportedMethods = {
  async getAllPosts() {
    const postCollection = await posts();
    return await postCollection.find({}).toArray();
  },
  async getPostById(id) {
    id = validation.checkId(id);
    const postCollection = await posts();
    const post = await postCollection.findOne({_id: ObjectId(id)});

    if (!post) throw 'Error: Post not found';
    return post;
  },
  async addPost(title, body, posterId) {
    title = validation.checkString(title, 'title');
    body = validation.checkString(body, 'body');
    posterId = validation.checkId(posterId);

    const userThatPosted = await userData.getUserById(posterId);

    let newPost = {
      title: title,
      body: body,
      poster: {
        id: posterId,
        name: `${userThatPosted.firstName} ${userThatPosted.lastName}`
      }
    };
    const postCollection = await posts();
    const newInsertInformation = await postCollection.insertOne(newPost);
    if (!newInsertInformation.insertedId) throw 'Error: Insert failed!';

    return this.getPostById(newInsertInformation.insertedId.toString());
  },
  async removePost(id) {
    id = validation.checkId(id);
    const postCollection = await posts();
    const deletionInfo = await postCollection.findOneAndDelete({
      _id: ObjectId(id)
    });
    if (deletionInfo.lastErrorObject.n === 0)
      throw `Could not delete post with id of ${id}`;
    return {...deletionInfo.value, deleted: true};
  },
  async updatePost(id, title, body, posterId) {
    id = validation.checkId(id);
    title = validation.checkString(title, 'title');
    body = validation.checkString(body, 'body');
    posterId = validation.checkId(posterId);
    const userThatPosted = await userData.getUserById(posterId);

    let updatedPost = {
      title: title,
      body: body,
      poster: {
        id: posterId,
        firstName: userThatPosted.firstName,
        lastName: userThatPosted.lastName
      }
    };
    const postCollection = await posts();
    const updateInfo = await postCollection.findOneAndUpdate(
      {_id: ObjectId(id)},
      {$set: updatedPost},
      {returnDocument: 'after'}
    );
    if (updateInfo.lastErrorObject.n === 0) throw 'Error: Update failed';
    return updateInfo.value;
  }
};

export default exportedMethods;
