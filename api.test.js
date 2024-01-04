const request = require('supertest');
const app = require('./index');
const { connect, disconnect } = require('mongoose');

beforeAll(async () => {
  // Connect to the MongoDB test database
  await connect('mongodb+srv://arsaluddin134:AxluRXMaNJ7RDJZ9@cluster0.jajb9lk.mongodb.net/', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  
  await disconnect();
});

describe('API Tests', () => {
  let authToken; // Store the authentication token for later use

  it('should create a new user account', async () => {
    try {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({ username: 'testuser', password: 'testpassword' });

      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('message', 'User created successfully');
      const token = response.body.token;
    } catch (error) {
      console.error('Error in should create a new user account:', error);
      throw error;
    }
  });

  it('should log in to an existing user account and receive an access token', async () => {
    try {
      // Log in with the registered user
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser', password: 'testpassword' });

      expect(loginResponse.statusCode).toBe(200);
      expect(loginResponse.body).toHaveProperty('token');
      expect(loginResponse.body).toHaveProperty('message', 'Login successful');

      authToken = loginResponse.body.token; // Save the authentication token for later use
    } catch (error) {
      console.error('Error in should log in to an existing user account:', error);
      throw error;
    }
  });

  it('should get a list of notes', async () => {
    try {
      const response = await request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${authToken}`);

      console.log('Response:', response.body); // Add this line for debugging

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeInstanceOf(Array); // Adjust based on your expected response
    } catch (error) {
      console.error('Error in should get a list of notes:', error);
      throw error;
    }
  });

  it('should create a new note', async () => {
    try {
      const newNote = { title: 'Test Note', content: 'Test Content' };

      const response = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newNote);

      console.log('Response:', response.body); // Add this line for debugging

      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty('title', 'Test Note');
      expect(response.body).toHaveProperty('content', 'Test Content');
    } catch (error) {
      console.error('Error in should create a new note:', error);
      throw error;
    }
  });

  // Add more test cases for other endpoints...

});
