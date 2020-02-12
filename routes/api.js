/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

"use strict";

var expect = require("chai").expect;
const MongoClient = require("mongodb").MongoClient;
const assert = require("assert");
const ObjectId = require("mongodb").ObjectID;

const CONNECTION_STRING = process.env.DB;

module.exports = function(app) {
  MongoClient.connect(CONNECTION_STRING, function(err, client) {
    var dbo = client.db("messageboard");
    var db = dbo.collection("messageboard");

    app
      .route("/api/threads/:board")
      .post(function(req, res) {
        var created_on = new Date().toISOString();
        var newThread = {
          board: req.body.board || req.params.board,
          text: req.body.text,
          delete_password: req.body.delete_password,
          created_on: created_on,
          bumped_on: created_on,
          reported: false,
          replycount: 0,
          replies: []
        };
        db.insertOne(newThread, function(err, cb) {
          res.redirect("/b/" + req.params.board);
        });
      })
      .get(function(req, res) {
        db.find(
          { board: req.params.board },
          {
            delete_password: 0,
            "replies.delete_password": 0,
            reported: 0,
            replies: { $slice: -3 }
          }
        )
          .sort({ bumped_on: -1 })
          .limit(10)
          .toArray(function(err, cb) {
            res.json(cb);
          });
      })
      .delete(function(req, res) {
        db.findOneAndDelete(
          { _id: ObjectId(req.body.thread_id), board: req.params.board },
          function(err, cb) {
            if (cb.value == null) {
              res.send("incorrect password");
            } else {
              res.send("success");
            }
          }
        );
      })
      .put(function(req, res) {
        db.findOneAndUpdate(
          { _id: ObjectId(req.body.report_id), board: req.params.board },
          { $set: { reported: true } },
          function(err, cb) {
            res.send("success");
          }
        );
      });
    /*
I can POST a thread to a specific message board by passing form data text and deletepassword_ to /api/threads/{board}.
(Recommend res.redirect to board page /b/{board}) 
Saved will be at least _id, text, createdon_(date&time), bumpedon_(date&time, 
starts same as created_on), reported(boolean), deletepassword_, & replies(array).

least _id
board
text
createdon_(date&time)
bumpedon_(date&time starts same as created_on)
reported(boolean)
deletepassword_
replies(array)
*/

    app
      .route("/api/replies/:board")
      .post(function(req, res) {
        var created_on = new Date().toISOString();
        var reply_id = ObjectId();
        var boardToPost = req.body.board;
        var threadToPost = req.body.thread_id;
        var newReply = {
          _id: reply_id,
          text: req.body.text,
          delete_password: req.body.delete_password,
          created_on: created_on,
          reported: false
        };

        db.findOneAndUpdate(
          { _id: ObjectId(threadToPost) },
          {
            $push: { replies: newReply },
            $set: { bumped_on: created_on },
            $inc: { replycount: 1 }
          },
          function(err, cb) {
            res.redirect("/b/" + req.params.board + "/" + req.body.thread_id);
          }
        );
      })
      .get(function(req, res) {
        db.findOne(
          { _id: ObjectId(req.query.thread_id) },
          { delete_password: 0, "replies.delete_password": 0, reported: 0 },
          function(err, cb) {
            res.json(cb);
          }
        );
      })
      .delete(function(req, res) {
        db.findOneAndUpdate(
          {
            _id: ObjectId(req.body.thread_id),
            board: req.params.board,
            "replies._id": ObjectId(req.body.reply_id),
            "replies.delete_password": req.body.delete_password
          },
          { $set: { "replies.$.text": "[deleted]" } },
          function(err, cb) {
            if (cb.value == null) {
              res.send("incorrect password");
            } else {
              res.send("success");
            }
          }
        );
      })
      .put(function(req, res) {
        db.findOneAndUpdate(
          {
            _id: ObjectId(req.body.thread_id),
            board: req.params.board,
            "replies._id": ObjectId(req.body.reply_id)
          },
          { $set: { "replies.$.reported": true } },
          function(err, cb) {
            res.send("success");
          }
        );
      });
    /*
I can POST a reply to a thread on a specific board by passing form data
 text, deletepassword_, & threadid_ to /api/replies/{board} and it will also update the bumped_on date to the comments date.
(Recommend res.redirect to thread page /b/{board}/{thread_id}) 
In the thread's replies array will be saved _id, text, createdon_, deletepassword_, & reported.

saved _id,
text, createdon_,
deletepassword_,
reported
  */
    //Sample front-end
    app.route("/b/:board/").get(function(req, res) {
      res.sendFile(process.cwd() + "/views/board.html");
    });
    app.route("/b/:board/:threadid").get(function(req, res) {
      res.sendFile(process.cwd() + "/views/thread.html");
    });

    //Index page (static HTML)
    app.route("/").get(function(req, res) {
      res.sendFile(process.cwd() + "/views/index.html");
    });

    //404 Not Found Middleware
    app.use(function(req, res, next) {
      res
        .status(404)
        .type("text")
        .send("Not Found");
    });
  });
};
