const { toArray } = require('lodash');

module.exports = function(app, passport, db) {

// normal routes ===============================================================

    // show the home page (will also have our login links)
    app.get('/', function(req, res) {
        res.render('index.ejs');
    });

    // PROFILE SECTION =========================
    app.get('/profile', isLoggedIn, function(req, res) {
          res.render('profile.ejs', {

            user : req.user
            
      })
    });
    

    // LOGOUT ==============================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

// message board routes ===============================================================

//

    app.get('/notes', isLoggedIn, function(req, res) {
      db.collection('messages').find({email: req.user.local.email}).toArray((err, result) => {
        if (err) return console.log(err)
        res.render('notes.ejs', {
          user : req.user,
          messages: result,
          date: req.query.date,
          total: req.query.total
        })
      })
    });

    app.post('/messages', (req, res) => {
      db.collection('messages').save(

        {
        
        date: new Date(req.body.date),
        itemBought: req.body.itemBought,
        amountSpent: Number(req.body.amountSpent),
        email: req.user.local.email}, 
        
        
        (err, result) => {
        if (err) return console.log(err)
        console.log('saved to database')
        res.redirect('/notes')

      })
    })


    app.delete('/messages', (req, res) => {
      db.collection('messages').findOneAndDelete({_id: ObjectId(req.body._id)}, (err, result) => {
        if (err) return res.send(500, err)
        res.send('Message deleted!')
      })
    })

//EDIT PURCHASE
  var ObjectId = require('mongodb').ObjectId; 

    app.get('/editNote', isLoggedIn, function(req, res) {
        console.log(req.query.noteId)
        db.collection('messages').findOne({_id: ObjectId(req.query.noteId)}, (err, result) => {
          if (err) return res.send(500, err)
          console.log(result)
          res.render('editNotes.ejs', {            
            user : req.user,
            message: result,
})
        })   
    })

//SUBMIT EDITED PURCHASE:

    app.get('/updateMessage', isLoggedIn, function(req, res) {
      db.collection('messages').find({email: req.user.local.email}).toArray((err, result) => {
        if (err) return console.log(err)
        res.render('notes.ejs', {
          user : req.user,
          messages: result,
          date: undefined ,
          total: undefined
      })
    })

    }  
  )

    app.post('/updateMessage',(req, res) => {
      db.collection('messages').update ({ _id: ObjectId(req.body.objectID) }, {$set: {

        date: new Date(req.body.date),
        itemBought: req.body.itemBought,
        amountSpent: Number(req.body.amountSpent)

      }
      }, function (err, result) {
          if (err) {
          console.log(err);
        } else {
          console.log("Post Updated successfully");
          res.redirect('/updateMessage')
      }
    });

  });

//CHECK SPENDING

app.post('/checkTotal', (req, res) => {

  console.log(req.body.checkSpendingForDate)
  db.collection('messages').aggregate(
    [

      {$match: {
        date: new Date(req.body.checkSpendingForDate),
        email: req.user.local.email
      
        }
      },

 

      {$group: {_id: null, 
        
                total: { $sum: '$amountSpent'}}
      } 
    ]).toArray().then((result) => {
      console.log(result)

      let total = (result.length === 0 ) ? 0 : result[0].total
 
      
      res.redirect(`/notes?date=${req.body.checkSpendingForDate}&total=${total}`)
      

    
    })

});





// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

    // locally --------------------------------
        // LOGIN ===============================
        // show the login form
        app.get('/login', function(req, res) {
            res.render('login.ejs', { message: req.flash('loginMessage') });
        });

        // process the login form
        app.post('/login', passport.authenticate('local-login', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/login', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

        // SIGNUP =================================
        // show the signup form
        app.get('/signup', function(req, res) {
            res.render('signup.ejs', { message: req.flash('signupMessage') });
        });

        // process the signup form
        app.post('/signup', passport.authenticate('local-signup', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/signup', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

    // local -----------------------------------
    app.get('/unlink/local', isLoggedIn, function(req, res) {
        var user            = req.user;
        user.local.email    = undefined;
        user.local.password = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

//     app.get('/notes', isLoggedIn, 

//     function(req, res) {
//       db.collection('messages').find().toArray((err, result) => {
//         if (err) return console.log(err)
//         res.render('notes.ejs', {
//           user : req.user,
//           messages: result
//       })
//     })

//     }  
//   )

// };



    app.post('/notes', isLoggedIn, 

      function(req, res) {
        db.collection('messages').find({email: req.user.local.email}).toArray((err, result) => {
          if (err) return console.log(err)
          res.render('notes.ejs', {
            user : req.user,
            messages: result,
            date: undefined,
            total: undefined
        })
      })

      }  
    )

};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}




