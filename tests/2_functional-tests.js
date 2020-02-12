/*
 *
 *
 *       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
 *       -----[Keep the tests in the same order!]-----
 *       (if additional are added, keep them at the very end!)
 */

var chaiHttp = require("chai-http");
var chai = require("chai");
var assert = chai.assert;
var server = require("../server");
chai.use(require("chai-dom"));
chai.use(chaiHttp);

suite("Functional Tests", function() {
  suite("API ROUTING FOR /api/threads/:board", function() {
    suite("POST", function() {
      test("post", function(done) {
        chai
          .request(server)
          .post("/api/threads/test")
          .send({ text: "testText", delete_password: "deleteTest" })
          .end(function(err, res) {
            assert.equal(res.status, 200, "response status should be 200");
            assert.include(
              res.redirects[0],
              "/b/test",
              "string contains boardurl"
            );
            done();
          });
      });
    });

    suite("GET", function() {
      test("get", function(done) {
        chai
          .request(server)
          .get("/api/threads/test")
          .end(function(err, res) {
            assert.equal(res.status, 200, "response status should be 200");
            assert.include(res.body[0].board, "test", " correct board name");
            assert.include(
              res.body[0].text,
              "testText",
              " correct thread text"
            );
            assert.equal(res.body[0].replies.length, 0, "empty reply array");
            done();
          });
      });
    });

    suite("DELETE", function() {
      test("delete", function(done) {
        var objectToTest = {
          text: "deleteTest",
          delete_password: "deleteTest"
        };
        chai
          .request(server)
          .post("/api/threads/test")
          .send({
            text: objectToTest.text,
            delete_password: objectToTest.delete_password
          })
          .end(function(err, res) {
            chai
              .request(server)
              .get("/api/threads/test")
              .end(function(err, res) {
                objectToTest._id = res.body[0]._id;
                chai
                  .request(server)
                  .delete("/api/threads/test")
                  .send({
                    thread_id: objectToTest._id,
                    delete_password: objectToTest.delete_password
                  })
                  .end(function(err, res) {
                    chai
                      .request(server)
                      .get("/api/threads/test")
                      .end(function(err, res) {
                        assert.equal(
                          res.status,
                          200,
                          "response status should be 200"
                        );
                        assert.notEqual(
                          res.body[0]._id,
                          objectToTest._id,
                          "no id because deleted"
                        );
                        done();
                      });
                  });
              });
          });
      });
    });

    suite("PUT", function() {
      test("report", function(done) {
        var objectToTest = {
          text: "reportTest",
          delete_password: "deleteTest"
        };
        chai
          .request(server)
          .post("/api/threads/test")
          .send({
            text: objectToTest.text,
            delete_password: objectToTest.delete_password
          })
          .end(function(err, res) {
            chai
              .request(server)
              .get("/api/threads/test")
              .end(function(err, res) {
                objectToTest._id = res.body[0]._id;
                chai
                  .request(server)
                  .put("/api/threads/test")
                  .send({
                    report_id: objectToTest._id
                  })
                  .end(function(err, res) {
                    assert.equal(res.text, "success", "rightTest");
                    chai
                      .request(server)
                      .get("/api/threads/test")
                      .end(function(err, res) {
                        assert.equal(
                          res.body[0].text,
                          "reportTest",
                          "rightTest"
                        );
                        assert.notProperty(
                          res.body[0],
                          "reported",
                          "no reported key"
                        );
                        done();
                      });
                  });
              });
          });
      });
    });
  });

  suite("API ROUTING FOR /api/replies/:board", function() {
    suite("POST", function() {
      test("post", function(done) {
        var objectToTest = {
          text: "replyPostTest",
          delete_password: "deleteTest"
        };
        chai
          .request(server)
          .get("/api/threads/test")
          .end(function(err, res) {
            objectToTest._id = res.body[0]._id;
            chai
              .request(server)
              .post("/api/replies/test")
              .send({
                thread_id: objectToTest._id,
                board: objectToTest.board,
                text: objectToTest.text,
                delete_password: objectToTest.delete_password
              })
              .end(function(err, res) {
                assert.include(
                  res.redirects[0],
                  "/b/test/" + objectToTest._id,
                  "string contains boardurl and thread_id"
                );
                chai
                  .request(server)
                  .get("/api/replies/test")
                  .end(function(err, res) {
                    assert.equal(
                      res.status,
                      200,
                      "response status should be 200"
                    );
                    done();
                  });
              });
          });
      });
    });

    suite("GET", function() {
      test("get", function(done) {
        chai
          .request(server)
          .get("/api/threads/test")
          .end(function(err, res) {
            var objectToTest = { _id: res.body[0]._id };
            chai
              .request(server)
              .get("/api/replies/test/?thread_id=" + objectToTest._id)
              .end(function(err, res) {
                var last = res.body.replies.length;
                assert.equal(
                  res.body.replies[last - 1].text,
                  "replyPostTest",
                  "reply from before"
                );
                assert.equal(res.status, 200, "response status should be 200");
                done();
              });
          });
      });
    });

    suite("PUT", function() {
      test("report reply", function(done) {
        chai
          .request(server)
          .get("/api/threads/test")
          .end(function(err, res) {
            var objectToTest = { _id: res.body[0]._id };
            chai
              .request(server)
              .post("/api/replies/test")
              .send({
                thread_id: objectToTest._id,
                board: objectToTest.board,
                text: objectToTest.text,
                delete_password: objectToTest.delete_password
              })
              .end(function(err, res) {
                chai
                  .request(server)
                  .get("/api/replies/test/?thread_id=" + objectToTest._id)
                  .end(function(err, res) {
                    var last = res.body.replies.length;
                    chai
                      .request(server)
                      .put("/api/replies/test")
                      .send({
                        _id: objectToTest._id,
                        report_id: res.body.replies[last - 1]._id
                      })
                      .end(function(err, res) {
                        assert.equal(res.text, "success", "successful report");
                        assert.equal(
                          res.status,
                          200,
                          "response status should be 200"
                        );
                        done();
                      });
                  });
              });
          });
      });
    });

    suite("DELETE", function() {
      test("delete reply", function(done) {
        chai
          .request(server)
          .get("/api/threads/test")
          .end(function(err, res) {
            var objectToTest = {
              _id: res.body[0]._id,
              board: "test",
              text: "deleteReplyText",
              delete_password: "deleteReply"
            };
            chai
              .request(server)
              .post("/api/replies/test")
              .send({
                thread_id: objectToTest._id,
                board: objectToTest.board,
                text: objectToTest.text,
                delete_password: objectToTest.delete_password
              })
              .end(function(err, res) {
                chai
                  .request(server)
                  .get("/api/replies/test/?thread_id=" + objectToTest._id)
                  .end(function(err, res) {
                    var last = res.body.replies.length;
                    chai
                      .request(server)
                      .delete("/api/replies/test")
                      .send({
                        thread_id: objectToTest._id,
                        reply_id: res.body.replies[last - 1]._id,
                        delete_password: objectToTest.delete_password
                      })
                      .end(function(err, res) {
                        assert.equal(
                          res.text,
                          "success",
                          "successful reply delete"
                        );
                        assert.equal(
                          res.status,
                          200,
                          "response status should be 200"
                        );
                        done();
                      });
                  });
              });
          });
      });
    });
  });
});
