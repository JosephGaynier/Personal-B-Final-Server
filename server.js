const express = require("express");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const app = express();
const cors = require("cors");
const exjwt = require("express-jwt");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Header', 'Content-type,Authorization');
    next();
});
app.use(cors());

const port = process.env.port || 3000;

const secretKey = 'My super secret key';
const jwtMW = exjwt({
    secret: secretKey,
    algorithms: ['HS256']
});

var connection = mysql.createConnection({
    host : 'sql9.freemysqlhosting.net',
    user : 'sql9377168',
    password : '14U2xK8UTe',
    database: 'sql9377168'
});

app.get('/authorize', jwtMW, async (req, res) => {
    console.log("ERROR1");
    res.json({ success: true });
});

app.post('/signup', async (req, res) => {
    var username = req.body.username;
    var password = req.body.password;
    connection.query(`INSERT INTO user VALUES ("", "${username}", "${password}")`, function (error, results, fields) {
        if (error) throw error;
        res.json(results);
    });
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    connection.query(`SELECT id FROM user WHERE user.username = "${username}" && user.password = "${password}"`,
     function (error, users, fields) {
        if (error) throw error;
        if (users[0] !== undefined && users[0].id > 0) {
            let token = jwt.sign({ id: users[0].id, username }, secretKey, { expiresIn: '7d' });
            res.json({
                success: true,
                userId: users[0].id,
                err: null,
                token
            });
        }
        else {
            res.status(401).json({
                success: false,
                token: null,
                err: 'Username or password is incorrect'
            });
        }
    });
});

app.post('/budget/get', jwtMW, async (req, res) => {
    const { userId } = req.body;
    connection.query(`SELECT pb.id, pb.label, pb.budget, pb.backgroundColor, pb.userId, ae.actualExpense FROM personalBudget as pb LEFT JOIN actualExpense AS ae ON pb.id = ae.personalBudgetId WHERE pb.userId = ${userId} ORDER BY ae.actualExpense`,
     function (error, results, fields) {
        if (error) throw error;
        res.json({ results, success: true });
    });
});

app.post('/actual/get', jwtMW, async (req, res) => {
    const { userId } = req.body;
    connection.query(`SELECT ae.actualExpense AS budget, pb.backgroundColor, pb.label FROM personalBudget AS pb INNER JOIN actualExpense AS ae ON pb.id = ae.personalBudgetId WHERE pb.userId = ${userId} ORDER BY ae.actualExpense`,
     function (error, results, fields) {
        if (error) throw error;
        res.json({ results, success: true });
    });
});

app.post('/actual/get/unused', jwtMW, async (req, res) => {
    const { userId } = req.body;
    connection.query(`SELECT pb.id, pb.label, pb.budget, pb.backgroundColor, pb.userId FROM personalBudget AS pb LEFT JOIN actualExpense AS ae ON pb.id = ae.personalBudgetId WHERE pb.userId = ${userId} AND ae.id IS NULL ORDER BY ae.actualExpense`, 
      function (error, results, fields) {
        if (error) throw error;
        res.json({ results, success: true });
    });
});

app.post('/budget/add', jwtMW, async (req, res) => {
    const { category, budget, colorCode, userId } = req.body;
    connection.query(`INSERT INTO personalBudget VALUES ("", "${category}", "${budget}", "${colorCode}", "${userId}")`,
     function (error, results, fields) {
        if (error) throw error;
        console.log(results);
        res.json({ results, success: true });
    });
});

app.post('/actual/add', jwtMW, async (req, res) => {
    const { actualExpense, personalBudgetId, colorCode, userId } = req.body;
    connection.query(`INSERT INTO actualExpense VALUES ("", "${actualExpense}", "${personalBudgetId}", "${colorCode}", ${userId})`,
     function (error, results, fields) {
        if (error) throw error;
        console.log(results);
        res.json({ results, success: true });
    });
});

app.use((err, req, res, next) => {
    if (err.name === 'UnauthorizedError') {
        console.log("ERROR2");
        res.status(401).json({
            success: false,
            err
        });
    }
    else {
        next(err);
    }
});

app.listen(port, () => {
    console.log(`Server on port ${port}`);
});