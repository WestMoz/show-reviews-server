require('dotenv').config();
const express = require('express');
const sql = require('mysql2/promise');
const cors = require('cors');
const { urlencoded, request } = require('express');
const PORT = 4000;

const app = express();
app.use(express.json());
app.use(urlencoded({ extended: true }));
app.use(cors());

const pool = sql.createPool({
  host: process.env.host,
  user: process.env.user,
  password: process.env.password,
});

app.get('/get-shows', async (req, resp) => {
  console.log('get shows hit');
  try {
    const conn = await pool.getConnection();
    const response = await conn.execute('SELECT * FROM tvSeriesDb.shows');
    // const shows = resp[0]
    conn.release();
    resp.status(200).send(response[0]);
  } catch (error) {
    console.log(error);
    resp.status(500).send(error);
  }
});

app.get('/get-user', async (req, resp) => {
  console.log('get user hit');
  try {
    const conn = await pool.getConnection();
    const username = req.query.username;
    console.log(username);
    const response = await conn.execute(
      `SELECT * FROM tvSeriesDb.users WHERE username=?`,
      [username],
    );
    conn.release();
    resp.status(200).send(response[0][0]);
  } catch (error) {
    console.log(error);
    resp.status(500).send(error);
  }
});

app.post('/create-user', async (req, resp) => {
  console.log('create user hit');
  try {
    const conn = await pool.getConnection();
    const username = req.body.username;
    const profilePic = req.body.profilePic;
    const aboutMe = req.body.aboutMe;
    const age = req.body.age;

    const response = await conn.execute(
      `
            INSERT INTO tvSeriesDb.users (username, profilePic, aboutMe, age) VALUES (?,?,?,?)
        `,
      [username, profilePic, aboutMe, age],
    );

    conn.release();
    resp.status(200).send(response);
  } catch (error) {
    console.log(error);
    resp.status(500).send(error);
  }
});

app.post('/create-show', async (req, resp) => {
  console.log('create show hit');
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
      ],
    );

    conn.release();
    resp.status(200).send(response);
  } catch (error) {
    console.log(error);
    resp.status(500).send(error);
  }
});

app.listen(PORT, () => console.log(`app is listening on ${PORT}`));
