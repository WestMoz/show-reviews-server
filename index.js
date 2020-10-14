require("dotenv").config();
const express = require("express");
const sql = require("mysql2/promise");
const cors = require("cors");
const { urlencoded, request, response } = require("express");
const PORT = 4000;
const authorizeUser = require("./authorize/functions");
const aws = require("aws-sdk");

const app = express();
app.use(express.json());
app.use(urlencoded({ extended: true }));
app.use(cors());

const pool = sql.createPool({
  host: process.env.host,
  user: process.env.user,
  password: process.env.password,
});

aws.config.setPromisesDependency();
aws.config.update({
  accessKeyId: process.env.s3TokenKey,
  secretAccessKey: process.env.s3Secret,
  region: "us-east-1",
});
const s3 = new aws.S3();

app.get("/get-shows", async (req, resp) => {
  console.log("get shows hit");
  try {
    const conn = await pool.getConnection();
    const response = await conn.execute("SELECT * FROM tvSeriesDb.shows");
    // const shows = resp[0]
    conn.release();
    resp.status(200).send(response[0]);
  } catch (error) {
    console.log(error);
    resp.status(500).send(error);
  }
});

app.post("/get-s3-pic", authorizeUser, async (req, resp) => {
  console.log("get s3 pic hit");
  try {
    const username = req.decodedToken["cognito:username"];
    const conn = await pool.getConnection();
    const response = await conn.execute(
      "SELECT profilePic from tvSeriesDb.users WHERE username=?",
      [username]
    );
    const profilePic = `public/${response[0][0].profilePic}`;

    const params = {
      Bucket: "profilebucket140003-showreview",
      Key: profilePic,
      Expires: 30,
    };

    s3.getSignedUrlPromise("getObject", params)
      .then((url) => {
        console.log(url);
        resp.status(200).send(url);
      })

      .catch((err) => resp.status(500).send(err));
  } catch (error) {
    console.log(error);
    resp.status(500).send(error);
  }
});

app.post("/get-profile-pic", authorizeUser, async (req, resp) => {
  try {
    const username = req.decodedToken["cognito:username"];
    const conn = await pool.getConnection();
    const response = await conn.execute(
      "SELECT profilePic from tvSeriesDb.users WHERE username=?",
      [username]
    );
    conn.release();
    resp.status(200).send(response[0][0]);
  } catch (error) {
    console.log(error);
    resp.status(500).send(error);
  }
});

app.post("/get-user", authorizeUser, async (req, resp) => {
  console.log("get user hit");
  try {
    const conn = await pool.getConnection();
    const username = req.decodedToken["cognito:username"];
    console.log(username);
    const response = await conn.execute(
      `SELECT * FROM tvSeriesDb.users WHERE username=?`,
      [username]
    );
    conn.release();
    console.log(response[0][0]);
    resp.status(200).send(response[0][0]);
  } catch (error) {
    console.log(error);
    resp.status(500).send(error);
  }
});

app.put("/update-pic", authorizeUser, async (req, resp) => {
  try {
    const conn = await pool.getConnection();
    const username = req.decodedToken["cognito:username"];
    const profilePic = req.body.profilePic;

    const result = await conn.execute(
      "UPDATE tvSeriesDb.users SET profilePic=? WHERE username=?",
      [profilePic, username]
    );

    conn.release();
    resp.status(201).send(result);
  } catch (error) {
    console.log(error);
    resp.status(500).send(error);
  }
});

app.put("/update-user", authorizeUser, async (req, resp) => {
  try {
    const conn = await pool.getConnection();
    const username = req.decodedToken["cognito:username"];
    const profilePic = req.body.profilePic;
    const aboutMe = req.body.aboutMe;
    const age = req.body.age;
    const response = await conn.execute(
      "UPDATE tvSeriesDb.users SET profilePic = ? ,aboutMe = ? ,age = ? WHERE username = ? ",
      [profilePic, aboutMe, age, username]
    );
    conn.release();
    resp.status(201).send(response);
  } catch (error) {
    console.log(error);
    resp.status(500).send(error);
  }
});

app.post("/create-user", authorizeUser, async (req, resp) => {
  console.log("create user hit");
  try {
    const conn = await pool.getConnection();
    const username = req.decodedToken["cognito:username"];
    const profilePic = req.body.profilePic;
    const aboutMe = req.body.aboutMe;
    const age = req.body.age;

    const response = await conn.execute(
      `
            INSERT INTO tvSeriesDb.users (username, profilePic, aboutMe, age) VALUES (?,?,?,?)
        `,
      [username, profilePic, aboutMe, age]
    );

    conn.release();
    resp.status(200).send(response);
  } catch (error) {
    console.log(error);
    resp.status(500).send(error);
  }
});

app.post("/create-show", async (req, resp) => {
  console.log("create show hit");
  try {
    const imdbId = req.body.imdbId;
    const title = req.body.title;
    const plot = req.body.plot;
    const poster = req.body.poster;
    const actors = req.body.actors;
    const genre = req.body.actors;
    const runtime = req.body.runtime;
    const imdbRating = req.body.imdbRating;
    const totalSeasons = req.body.totalSeasons;
    const released = req.body.released;
    const rated = req.body.rated;
    console.log(req.body);

    const conn = await pool.getConnection();
    const response = await conn.execute(
      `
            INSERT INTO tvSeriesDb.shows (imdbId, title, plot, poster, actors, genre, runtime, imdbRating, totalSeasons, released, rated) VALUES
            (?,?,?,?,?,?,?,?,?,?,?)
        `,
      [
        imdbId,
        title,
        plot,
        poster,
        actors,
        genre,
        runtime,
        imdbRating,
        totalSeasons,
        released,
        rated,
      ]
    );

    conn.release();
    resp.status(200).send(response);
  } catch (error) {
    console.log(error);
    resp.status(500).send(error);
  }
});

app.get("/show-by-id", async (req, resp) => {
  try {
    const imdbId = req.query.imdbId;
    const conn = await pool.getConnection();
    const show = await conn.execute(
      `SELECT * FROM tvSeriesDb.shows WHERE imdbId = ?`,
      [imdbId]
    );
    conn.release();
    resp.status(201).send(show[0][0]);
  } catch (error) {
    console.log(error);
    resp.status(500).send(error);
  }
});

//create-review

app.post("/create-review", authorizeUser, async (req, resp) => {
  try {
    const showId = req.body.showId;
    const reviewedBy = req.decodedToken["cognito:username"];
    const review = req.body.review;
    const rating = req.body.rating;

    const conn = await pool.getConnection();
    const response = await conn.execute(
      `INSERT INTO tvSeriesDb.reviews (showId, reviewedBy, review, rating) VALUES (?,?,?,?)`,
      [showId, reviewedBy, review, rating]
    );
    conn.release();
    resp.status(201).send(response);
  } catch (error) {
    console.log(error);
    resp.status(500).send(error);
  }
});

app.get("/review-by-showid", async (req, resp) => {
  try {
    const showId = req.query.showId;
    const conn = await pool.getConnection();
    await conn.query("USE tvSeriesDb");
    const response = await conn.execute(
      `SELECT * FROM (SELECT * FROM shows as newShows 
        JOIN reviews as newReviews
        ON newShows.imdbId = newReviews.showId) as newTable WHERE newTable.imdbId=?`,
      [showId]
    );

    conn.release();
    resp.status(201).send(response[0]);
  } catch (error) {
    console.log(error);
    resp.status(500).send(error);
  }
});

app.get("/all-reviews", async (req, resp) => {
  try {
    const conn = await pool.getConnection();
    await conn.query("USE tvSeriesDb");
    const response = await conn.execute(`SELECT * FROM shows as newShows
    JOIN (SELECT * FROM reviews ) as newReviews
    ON newShows.imdbId = newReviews.showId`);
    conn.release();
    resp.status(200).send(response);
  } catch (error) {
    resp.status(500).send(error);
    console.log(error);
  }
});

app.post("/reviews-by-user", authorizeUser, async (req, resp) => {
  try {
    const reviewedBy = req.decodedToken["cognito:username"];
    const conn = await pool.getConnection();
    await conn.query("USE tvSeriesDb");
    const response = await conn.execute(
      `SELECT * FROM (SELECT * FROM shows as newShows 
        JOIN reviews as newReviews
        ON newShows.imdbId = newReviews.showId) as newTable WHERE newTable.reviewedBy=?`,
      [reviewedBy]
    );
    conn.release();
    resp.status(200).send(response);
  } catch (error) {
    resp.status(500).send(error);
    console.log(error);
  }
});

app.post("/follow-user", authorizeUser, async (req, resp) => {
  try {
    const userFollowed = req.body.userFollowed;
    const userFollowedBy = req.decodedToken["cognito:username"];

    const conn = await pool.getConnection();
    const followUser = await conn.execute(
      `INSERT INTO tvSeriesDb.following (userFollowed, userFollowedBy) VALUES (?,?)`,
      [userFollowed, userFollowedBy]
    );
    conn.release();
    resp.status(201).send(followUser);
  } catch (error) {
    console.log(error);
    resp.status(500).send(error);
  }
});

app.post("/unfollow-user", authorizeUser, async (req, resp) => {
  try {
    const userFollowed = req.body.userFollowed;
    const userFollowedBy = req.decodedToken["cognito:username"];

    const conn = await pool.getConnection();
    await conn.execute(
      `DELETE FROM tvSeriesDb.following WHERE userFollowed=? && userFollowedBy=?`,
      [userFollowed, userFollowedBy]
    );
    conn.release();
    resp.status(200).send({ message: "successfully deleted" });
  } catch (error) {
    resp.status(500).send(error);
    console.log(error);
  }
});

app.post("/all-followed-users", authorizeUser, async (req, resp) => {
  try {
    const userFollowedBy = req.decodedToken["cognito:username"];
    const conn = await pool.getConnection();
    const usersFollowed = await conn.execute(
      `SELECT * FROM tvSeriesDb.following WHERE userFollowedBy = ?`,
      [userFollowedBy]
    );
    conn.release();
    resp.status(201).send(usersFollowed[0]);
  } catch (error) {
    console.log(error);
    resp.status(500).send(error);
  }
});

app.listen(PORT, () => console.log(`app is listening on ${PORT}`));
