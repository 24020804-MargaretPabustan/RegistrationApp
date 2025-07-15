const express = require('express');
const mysql = require('mysql2');

//******** TODO: Insert code to import 'express-session' *********//
const session = require('express-session');

const flash = require('connect-flash');

const app = express();
// const PORT = process.env.PORT || 3000;


// Database connection
const db = mysql.createConnection({
    host: '9jw3t0.h.filess.io',
    user: 'C237database_identityhe',
    port: 3307,
    password: '8d7b3f89bd1de82964cd0cb4f013965ce29ef723',
    database: 'C237database_identityhe'
});

db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('Connected to database');
});

app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

//******** TODO: Insert code for Session Middleware below ********// : This code manages sessions, to remember the user
app.use(session({
    secret:'secret', //Password to protect session data
    resave: false, //Don't save session if no session data has changed
    saveUninitialized: true, //Save a new session to session store (memory box) even if no data is in it yet
    //Session expires after 1 week of inactivity
    cookie: {maxAge: 1000 * 60 * 60 * 24 * 7} //How long the session should last before it expires, expires after 1 week (1000ms)

}));

app.use(flash());

// Setting up EJS
app.set('view engine', 'ejs');

//******** TODO: Create a Middleware to check if user is logged in. ********//
const checkAuthenticated = (req,res,next) => { //Checks if user is logged in
    if (req.session.user) { //If user object exists, user has already logged in
        return next(); //calls next(), to tell express to keep going
    } else {
        req.flash('error', 'Please log in to view this resource'); //If not logged in, this message will be printed//
        res.redirect('/login');
    }
};
//******** TODO: Create a Middleware to check if user is admin. ********//
const checkAdmin = (req,res,next) => {
    if (req.session.user.role === 'admin') {
        return next();
    }else {
        req.flash('error', 'Access denied');
        res.redirect('/dashboard');
    }
};
// Routes
app.get('/', (req, res) => {
    res.render('index', { user: req.session.user, messages: req.flash('success')}); //Send the logged-in user's data and success messages to the index page//
}); 

app.get('/register', (req, res) => {
    res.render('register', { messages: req.flash('error'), formData: req.flash('formData')[0] });
});


//******** TODO: Create a middleware function validateRegistration ********//
const validateRegistration = (req,res,next) => {
    const{username, email, password, address, contact} = req.body; //The info that user puts into the form, is extracted from req.body object and put into separate variables (destructuring)//

    if(!username || !email || !password || !address || !contact) { //If user does not enter ANY of these info
        return res.status(400).send('All fields are required'); //A message "All fields are required" will be displayed//

    }
    if (password.length < 6) {
        req.flash('error', 'Password should be at least 6 or more characters long');
        req.flash('formData', req.body); //This saves form input that the user just input into a flash message called 'formData', you can pre-fill the form when they fix password so they don't have to retype everything
        return res.redirect('/register'); //Redirecting user to /register page
    }
    next();
};

//******** TODO: Integrate validateRegistration into the register route. ********//
app.post('/register', validateRegistration,(req, res) => { // /register: A route  for when a user submits a registration form to /register URL using POST method
    //******** TODO: Update register route to include role. ********//
    const { username, email, password, address, contact, role} = req.body; //values in req.body object are extracted and stored in separate variables//

    const sql = 'INSERT INTO users (username, email, password, address, contact, role) VALUES (?, ?, SHA1(?), ?, ?, ?)'; //variable called "sql" contains the statement to add a new user to the users table
    db.query(sql, [username, email, password, address, contact,role], (err, result) => { //db.query runs SQL query, the values in the square brackets replace the placeholders
        if (err) { //If there are any errors
            throw err; //The error will be thrown and stop the process
        }
        console.log(result); //Print the information from database table to console, to check if the INSERT statement worked
        req.flash('success', 'Registration successful! Please log in.'); //Sending a message to tell user they registered successfully
        res.redirect('/login'); //Redirect user to login page
    });
});

//******** TODO: Insert code for login routes to render login page below ********//
app.get('/login', (req,res) => { //Defining a /login route using the GET method to view the login page//

    res.render('login', { //Tell Express to display a HTML page called 'login'//, 
        messages: req.flash('success'), //Retrieve success messages, pass them into login page, Useful as it shows success messages like "You registered successfully, log in!"//
        errors: req.flash('error') //Retrieve error messages from the session and pass them into the login page, Useful as it shows error messages like "Incorrect username or password"//
    });
});

//******** TODO: Insert code for login routes for form submission below ********//
app.post('/login', (req,res) => { //Handles form submission from login page//
    const{email, password} = req.body; //Take email and password from req.body and store them in variables
    //Validate email and password
    if (!email || !password) { //Checks if either is missing, 
        req.flash('error', 'All fields are required'); //If missing: Error message "All fields are required"will be printed//
        return res.redirect('/login');
    }
    const sql = 'SELECT * FROM users WHERE email = ? AND password = SHA1(?)'; //variable sql contains SQL query to check all credentials//
    db.query(sql, [email,password], (err,results) => { //Runs SQL statement with user's email and password//
        if (err) { //If there is an error (like DB connection issues)
            throw err; //Throw error and stop process/
        }
        if (results.length > 0) {
            //Successful login//
            req.session.user = results[0]; //Stores the logged-in user's information from DB into the session//
            req.flash('success', 'Login successful!'); //Creates a flash message to show a green success alert on the next page//
            res.redirect('/'); //Redirect user back to the homepage//
        } else{
            //Invalid Credentials//
            req.flash('error', 'Invalid email or password'); 
            res.redirect('/login'); //Redirect user back to login page so they can try again//
        }
    });
});
//******** TODO: Insert code for dashboard route to render dashboard page for users. ********//
app.get('/dashboard', checkAuthenticated, (req,res) => { //Sets up route for URL /dashboard, checkAuthentication is middleware which checks if user is logged in, then user proceed to dashboard
    res.render('dashboard', {user:req.session.user}); //If user is logged in, server shows dashboard page//
});
//******** TODO: Insert code for admin route to render dashboard page for admin. ********//
app.get('/admin', checkAuthenticated,checkAdmin,(req,res) => {
    res.render('admin', {user:req.session.user});
});
//******** TODO: Insert code for logout route ********//
app.get('/logout',(req,res) => {
    req.session.destroy(); //Destroys user's session and redirects them to the homepage
    res.redirect('/');
}); //Why GET route? logging out is done by clicking a link, which sends a GET request//

// Starting the server
app.listen(3000, () => {
    console.log('Server started on port 3000 http://localhost:3000/');
});

// app.listen(PORT,() => console.log (`Server running on port ${PORT}`));
