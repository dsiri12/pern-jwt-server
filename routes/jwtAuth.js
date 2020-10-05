const router = require("express").Router()
const pool = require("../db");
const bcrypt = require("bcrypt");
const route = require("express").Router();
const jwtGenerator = require('../utils/jwtGenerator');
const validInfo = require('../middleware/validInfo');
const authorization = require('../middleware/authorization');

//registering

router.post("/register",validInfo, async (req, res) => {
    try { 
        //1. destructure the req.body (name, email, password)
        const { name, email, password } = req.body;

        //2. check if user exists (if user exist then throw error)
        const user = await pool.query("SELECT * FROM users WHERE user_email = $1", [
            email
        ]);

        if(user.rows.length !== 0) {
            return res.status(401).json("User already exist");
        }

        //3. Bcrypt the user password

        const saltRound = 10;
        const salt = await bcrypt.genSalt(saltRound);

        const bcryptPassword = await bcrypt.hash(password, salt);

        //4. enter the new user inside our database
        const newUser = await pool.query(
            "INSERT INTO users (user_name, user_email, user_password) VALUES ($1, $2, $3) RETURNING *", 
            [name, email, bcryptPassword]
        );

        //5. generating our jwt token
        const token = jwtGenerator(newUser.rows[0].user_id);

        res.json({ token });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error")
    }
});

//login route

router.post("/login", validInfo, async (req, res) => {
    try {
        
        //1. destructure the req.body

        const { email, password } = req.body;

        //2. check if user doesn't exist (if not then we throw out)

        const user = await pool.query("SELECT * FROM users WHERE user_email = $1", [
            email
        ]);

        if(user.rows.length === 0) {
            return res.status(401).json("Password or Email is incorrect");
        }

        //3. check if incoming password is the same the database password

        const validPassword = await bcrypt.compare(
            password, 
            user.rows[0].user_password
        );

        if(!validPassword) {
            return res.status(401).json("Password or Email is incorrect")
        }

        //4. give them the jwt token

        const token = jwtGenerator(user.rows[0].user_id);

        res.json({ token })
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error")
    }
});

router.get("/is-verify", authorization, async (req, res) => {
    try {
        res.json(true);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error")
    }
});

module.exports = router;

/*
POST http://localhost:5000/auth/register
body:
{
    "name": "test8",
    "email": "test8@gmail.com",
    "password":"test123"
}
output:
200 OK
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNzg4ZmZhMGUtZjcxYi00OTNlLTkyZDMtMGY4MjQ0MTFiMmM5IiwiaWF0IjoxNjAxNjU4NzYxLCJleHAiOjE2MDE2NjIzNjF9._FEBPmlmDsyVh1zA_aG_k6zDSCgw2xWCfVVUIsEcQx0"
}

---------------
POST http://localhost:5000/auth/login
body:
{
    "email": "test8@gmail.com",
    "password":"test123"
}
output
200 OK
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNzg4ZmZhMGUtZjcxYi00OTNlLTkyZDMtMGY4MjQ0MTFiMmM5IiwiaWF0IjoxNjAxNjU4ODU5LCJleHAiOjE2MDE2NjI0NTl9.B001MtdV6_NgwtJKapZkvUNiblgEjPnI829t31aR4iY"
}

------------------------------
GET http://localhost:5000/auth/is-verify
header
token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNzg4ZmZhMGUtZjcxYi00OTNlLTkyZDMtMGY4MjQ0MTFiMmM5IiwiaWF0IjoxNjAxNjU4ODU5LCJleHAiOjE2MDE2NjI0NTl9.B001MtdV6_NgwtJKapZkvUNiblgEjPnI829t31aR4iY

output:
200 OK
true
*/