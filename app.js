const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const path = require('path');
const bcrypt = require('bcrypt');
const ejs = require('ejs');
const app = express();
const serviceAccount = require('./sec.json');

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
const session = require('express-session');

app.use(session({
  secret: 'abc', // Change this to a secure random string
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to `true` if using HTTPS
}));
function convertTimestampToDate(data) {
  if (data.date && data.date.toDate) {
    data.date = data.date.toDate();
  }
  return data;
}

// Middleware to simulate user session for simplicity
app.use((req, res, next) => {
  req.user = req.session.user || null;
  next();
});

app.use((req, res, next) => {
  console.log('Session data:', req.session);
  console.log('User data:', req.user);
  next();
});

// Route for home page
app.get('/', (req, res) => res.render('index'));

// Route for login pages
app.get('/login', (req, res) => res.render('login'));
app.get('/student-login', (req, res) => res.render('student-login'));
app.get('/college-login', (req, res) => res.render('college-login'));

// Route for signup pages
app.get('/college-signup', (req, res) => res.render('college-signup'));
app.get('/student-signup', (req, res) => res.render('student-signup'));
app.get('/signup', (req, res) => res.render('signup'));

// Route for profile page
app.get('/profile', (req, res) => {
  const userType = req.user.type;
  if (userType === 'student') {
    res.render('student-profile');
  } else if (userType === 'college') {
    res.render('college-profile');
  } else {
    res.redirect('/');
  }
});

// Route to display all colleges
app.get('/colleges', async (req, res) => {
  try {
    const collegesSnapshot = await db.collection('colleges').get();
    const colleges = collegesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.render('colleges', { colleges });
  } catch (error) {
    console.error('Error fetching colleges:', error);
    res.status(500).json({ error: 'An error occurred while fetching colleges.' });
  }
});

// Route to display events for a specific college
app.get('/colleges/:id', async (req, res) => {
  try {
    const collegeId = req.params.id;
    const eventsSnapshot = await db.collection('events')
      .where('collegeId', '==', collegeId)
      .get();
    const events = eventsSnapshot.docs.map(doc => convertTimestampToDate({ id: doc.id, ...doc.data() }));
    res.render('college-events', { events });
  } catch (error) {
    console.error('Error fetching college events:', error);
    res.status(500).json({ error: 'An error occurred while fetching college events.' });
  }
});

// Route to display all events
app.get('/events', async (req, res) => {
  try {
    const eventsSnapshot = await db.collection('events').get();
    const events = eventsSnapshot.docs.map(doc => convertTimestampToDate({ id: doc.id, ...doc.data() }));
    res.render('events', { events, user: req.user });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'An error occurred while fetching events.' });
  }
});

// Route to handle event registration
app.post('/api/events/register', async (req, res) => {
  const { eventId, userId } = req.body;
  try {
    const eventRef = db.collection('events').doc(eventId);
    await eventRef.update({
      registeredUsers: admin.firestore.FieldValue.arrayUnion(userId)
    });
    res.redirect('/events');
  } catch (error) {
    console.error('Error registering for event:', error);
    res.status(500).json({ error: 'An error occurred while registering for the event.' });
  }
});

// Route to display upcoming events for the user
app.get('/upcoming-events', async (req, res) => {
  try {
    const upcomingEventsSnapshot = await db.collection('events')
      .where('registeredUsers', 'array-contains', req.user.id)
      .where('date', '>=', new Date())
      .orderBy('date')
      .get();
    const upcomingEvents = upcomingEventsSnapshot.docs.map(doc => convertTimestampToDate({ id: doc.id, ...doc.data() }));
    res.render('upcoming-events', { upcomingEvents });
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    res.status(500).json({ error: 'An error occurred while fetching upcoming events.' });
  }
});

// Route to display event history for the user
app.get('/event-history', async (req, res) => {
  try {
    const historyEventsSnapshot = await db.collection('events')
      .where('registeredUsers', 'array-contains', req.user.id)
      .where('date', '<', new Date())
      .orderBy('date', 'desc')
      .get();
    const historyEvents = historyEventsSnapshot.docs.map(doc => convertTimestampToDate({ id: doc.id, ...doc.data() }));
    res.render('event-history', { historyEvents });
  } catch (error) {
    console.error('Error fetching event history:', error);
    res.status(500).json({ error: 'An error occurred while fetching event history.' });
  }
});

// Route for sign out
app.get('/signout', (req, res) => {
  req.user = null; // Simulate sign out
  res.redirect('/');
});

// Route for contact page
app.get('/contact', (req, res) => res.render('contact'));

// Route for student signup
app.post('/student-signup', async (req, res) => {
  const { email, password, name } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10); // Hash the password
    const userRef = db.collection('students').doc();
    await userRef.set({ email, password: hashedPassword, name }); // Store hashed password
    res.status(200).json({ message: 'Sign up successful!' });
  } catch (error) {
    console.error('Error during student signup:', error);
    res.status(500).json({ error: 'An error occurred during signup' });
  }
});
app.post('/student-login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const snapshot = await db.collection('students').where('email', '==', email).get();
    if (snapshot.empty) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const student = snapshot.docs[0].data();
    const isMatch = await bcrypt.compare(password, student.password);

    if (isMatch) {
      req.session.user = { id: snapshot.docs[0].id, type: 'student' };
      console.log('Login successful:', req.session.user); // Debugging statement
      return res.status(200).json({ message: 'Login successful' });
    } else {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Error during college login:', error);
    return res.status(500).json({ error: 'An error occurred during login' });
  }
});
// Route for student dashboard
// Route for student dashboard
app.get('/student-dashboard', async (req, res) => {
  // Ensure req.user is set and is a student
  if (!req.user || req.user.type !== 'student') {
    console.error('Unauthorized access: req.user is not set or not a student', req.user);
    return res.redirect('/login'); // Redirect to login page or an appropriate page
  }

  try {
    const studentId = req.user.id; // Access student ID from req.user

    // Fetch latest events
    let latestEvents = [];
    try {
      const latestEventsSnapshot = await db.collection('events')
        .orderBy('date', 'desc')
        .limit(5)
        .get();
      latestEvents = latestEventsSnapshot.docs.map(doc => convertTimestampToDate({
        id: doc.id,
        ...doc.data() // Ensure toDate() is called on Timestamp objects
      }));
    } catch (error) {
      console.error('Error fetching latest events:', error);
      throw new Error('Failed to fetch latest events');
    }

    // Fetch upcoming events for the student
    let upcomingEvents = [];
    try {
      const registeredEventsSnapshot = await db.collection('events')
        .where('registeredUsers', 'array-contains', studentId)
        .where('date', '>=', new Date())
        .orderBy('date')
        .get();
      upcomingEvents = registeredEventsSnapshot.docs.map(doc => convertTimestampToDate({
        id: doc.id,
        ...doc.data() // Ensure toDate() is called on Timestamp objects
      }));
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
      throw new Error('Failed to fetch upcoming events');
    }

    // Fetch event history for the student
    let historyEvents = [];
    try {
      const historyEventsSnapshot = await db.collection('events')
        .where('registeredUsers', 'array-contains', studentId)
        .where('date', '<', new Date())
        .orderBy('date', 'desc')
        .get();
      historyEvents = historyEventsSnapshot.docs.map(doc => convertTimestampToDate({
        id: doc.id,
        ...doc.data() // Ensure toDate() is called on Timestamp objects
      }));
    } catch (error) {
      console.error('Error fetching event history:', error);
      throw new Error('Failed to fetch event history');
    }

    // Fetch all colleges
    let colleges = [];
    try {
      const collegesSnapshot = await db.collection('colleges').get();
      colleges = collegesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching colleges:', error);
      throw new Error('Failed to fetch colleges');
    }

    const success = req.query.success === 'true'; // Define success based on query parameter

    // Render student dashboard
    res.render('student-dashboard', {
      latestEvents,
      upcomingEvents,
      historyEvents,
      colleges,
      query: req.query,
      success, // Pass success to the template
      user: req.user // Pass user information to the template
    });
  } catch (error) {
    console.error('Error loading student dashboard:', error);
    res.status(500).send('Error loading student dashboard.');
  }
});

// Route for college signup
app.post('/college-signup', async (req, res) => {
  const { email, password, collegeName } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10); // Hash the password
    const collegeRef = db.collection('colleges').doc();
    await collegeRef.set({ email, password: hashedPassword, collegeName }); // Store hashed password
    res.status(200).json({ message: 'Sign up successful!' });
  } catch (error) {
    console.error('Error during college signup:', error);
    res.status(500).json({ error: 'An error occurred during signup' });
  }
});

// Route for college login
app.post('/college-login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const snapshot = await db.collection('colleges').where('email', '==', email).get();
    if (snapshot.empty) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const college = snapshot.docs[0].data();
    const isMatch = await bcrypt.compare(password, college.password);

    if (isMatch) {
      req.session.user = { id: snapshot.docs[0].id, type: 'college' };
      console.log('Login successful:', req.session.user); // Debugging statement
      return res.status(200).json({ message: 'Login successful' });
    } else {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Error during college login:', error);
    return res.status(500).json({ error: 'An error occurred during login' });
  }
});

// Route for college dashboard
app.get('/college-dashboard', async (req, res) => {
  if (!req.user || !req.user.id || req.user.type !== 'college') {
    return res.status(401).json({ error: 'Unauthorized access' });
  }

  const collegeId = req.user.id;

  try {
    // Fetch all college events
    const collegeEventsSnapshot = await db.collection('events')
      .where('collegeId', '==', collegeId)
      .get();
    const collegeEvents = collegeEventsSnapshot.docs.map(doc => convertTimestampToDate({
      id: doc.id,
      ...doc.data()
    }));

    // Fetch upcoming events
    const upcomingEventsSnapshot = await db.collection('events')
      .where('collegeId', '==', collegeId)
      .where('date', '>=', new Date())
      .orderBy('date')
      .get();
    const upcomingEvents = upcomingEventsSnapshot.docs.map(doc => convertTimestampToDate({
      id: doc.id,
      ...doc.data()
    }));

    // Fetch event history
    const historyEventsSnapshot = await db.collection('events')
      .where('collegeId', '==', collegeId)
      .where('date', '<', new Date())
      .orderBy('date', 'desc')
      .get();
    const historyEvents = historyEventsSnapshot.docs.map(doc => convertTimestampToDate({
      id: doc.id,
      ...doc.data()
    }));

    res.render('college-dashboard', {
      collegeEvents,
      upcomingEvents,
      historyEvents,
      user: req.user
    });
  } catch (error) {
    console.error('Error loading college dashboard:', error);
    res.status(500).json({ error: 'An error occurred while loading the dashboard.' });
  }
});

// Route to handle event posting for colleges
app.post('/api/events', async (req, res) => {
  const { name, description, date, location, collegeId } = req.body;
  try {
    await db.collection('events').add({
      name,
      description,
      date: new Date(date), // Ensure date is stored correctly
      location,
      collegeId,
      registeredUsers: []
    });
    res.redirect('/college-dashboard');
  } catch (error) {
    console.error('Error posting event:', error);
    res.status(500).json({ error: 'An error occurred while posting the event.' });
  }
});


// Route to display a form for posting an event
app.get('/post-event', (req, res) => {
  if (req.user.type === 'college') {
    res.render('post-event');
  } else {
    res.redirect('/'); // Redirect to home or an error page
  }
});

// Route to handle posting an event
app.post('/post-event', async (req, res) => {
  const { name, type, subject, location, eligibility } = req.body;
  try {
    if (req.user.type !== 'college') {
      return res.redirect('/'); // Ensure only colleges can post events
    }

    await db.collection('events').add({
      name,
      type,
      subject,
      location,
      eligibility,
      collegeId: req.user.id,
      date: new Date() // Add a default date or handle it if included in the form
    });

    res.redirect('/college-dashboard?success=true');
  } catch (error) {
    console.error('Error posting event:', error);
    res.status(500).json({ error: 'An error occurred while posting the event.' });
  }
});

// Route to display event history for a college
app.get('/college-history', async (req, res) => {
  try {
    const collegeId = req.user.id;
    const historyEventsSnapshot = await db.collection('events')
      .where('collegeId', '==', collegeId)
      .where('date', '<', new Date())
      .orderBy('date', 'desc')
      .get();
    const historyEvents = historyEventsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate()
    }));
    res.render('college-history', { historyEvents });
  } catch (error) {
    console.error('Error fetching college history:', error);
    res.status(500).json({ error: 'An error occurred while fetching college history.' });
  }
});

// Route to display upcoming events for a college
app.get('/college-upcoming-events', async (req, res) => {
  try {
    const collegeId = req.user.id;
    const upcomingEventsSnapshot = await db.collection('events')
      .where('collegeId', '==', collegeId)
      .where('date', '>=', new Date())
      .orderBy('date')
      .get();
    const upcomingEvents = upcomingEventsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate()
    }));
    res.render('college-upcoming-events', { upcomingEvents });
  } catch (error) {
    console.error('Error fetching college upcoming events:', error);
    res.status(500).json({ error: 'An error occurred while fetching upcoming events.' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
