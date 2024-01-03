import * as chai from 'chai';
import chaiHttp from 'chai-http';
import app from './index.js'; // Update the path accordingly
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import jest from 'jest';



chai.use(chaiHttp);
const { expect } = chai;
const TIMEOUT = 5000;


describe('API Tests', () => {
  before(async () => {
    await mongoose.connect('mongodb+srv://arsaluddin134:AxluRXMaNJ7RDJZ9@cluster0.jajb9lk.mongodb.net/', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

//   after(async () => {
//     await mongoose.connection.close();
//   });

  beforeEach(async () => {
    try {
        await mongoose.connect('mongodb+srv://arsaluddin134:AxluRXMaNJ7RDJZ9@cluster0.jajb9lk.mongodb.net/'); // Your connection string
        await mongoose.connection.collections['notes'].deleteMany({});
        await mongoose.connection.collections['users'].deleteMany({});
        // done();
    } catch (error) {
        throw error; // Ensure error handling
    }
});


  describe('Authentication Endpoints', () => {
    it('should create a new user account', async () => {
    //   jest.setTimeout(TIMEOUT);  
      const res = await chai.request(app)
        .post('/api/auth/signup')
        .send({ username: 'testuser', password: 'testpassword' });

      expect(res).to.have.status(201);
      expect(res.body.message).to.equal('User created successfully');
      expect(res.body.user).to.have.property('_id');
    });

    it('should log in to an existing user account and receive an access token', async () => {
      // First, create a user
    //   jest.setTimeout(TIMEOUT); 
      const userRes = await chai.request(app)
        .post('/api/auth/signup')
        .send({ username: 'testuser', password: 'testpassword' });

      const userId = userRes.body.user._id;

      // Now, try to log in
      const loginRes = await chai.request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser', password: 'testpassword' });

      expect(loginRes).to.have.status(200);
      expect(loginRes.body.message).to.equal('Login successful');
      expect(loginRes.body).to.have.property('token');

      const decodedToken = jwt.verify(loginRes.body.token, 'your_secret_key');
      expect(decodedToken.userId).to.equal(userId);
    });
  });

  describe('Note Endpoints', () => {
    it('should get a list of all notes for the authenticated user', async () => {
      // Create a user
    //   jest.setTimeout(TIMEOUT); 
      const userRes = await chai.request(app)
        .post('/api/auth/signup')
        .send({ username: 'testuser', password: 'testpassword' });

      const userId = userRes.body.user._id;

      // Log in to get the token
      const loginRes = await chai.request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser', password: 'testpassword' });

      const token = loginRes.body.token;

      // Create a note for the user
      const noteRes = await chai.request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Test Note', content: 'Test Content' });

      const noteId = noteRes.body._id;

      // Get the list of notes for the user
      const getNotesRes = await chai.request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${token}`);

      expect(getNotesRes).to.have.status(200);
      expect(getNotesRes.body).to.be.an('array');
      expect(getNotesRes.body).to.have.lengthOf(1);
      expect(getNotesRes.body[0]._id).to.equal(noteId);
    });

    // Add more test cases for other Note endpoints...
  });
});

// Additional tests for other endpoints...
