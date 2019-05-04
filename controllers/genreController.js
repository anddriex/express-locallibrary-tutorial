const { body, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
var async = require('async');

var Book = require('../models/book');
var Genre = require('../models/genre');

// Display list of all Genre.
exports.genre_list = function(req, res, next) {
    Genre.find()
    .sort([['name', 'ascending']])
    .exec(function(err, list_genre) {
        if (err) {return next(err);}
        // Succesfull, so render
        res.render('genre_list', {title: 'Genre List', genre_list: list_genre});
    });
};

// Display detail page for a specific Genre.
exports.genre_detail = function(req, res) {
    async.parallel({
        genre: function(callback) {
            Genre.findById(req.params.id)
            .exec(callback);
        },

        genre_books: function(callback) {
            Book.find({ 'genre': req.params.id})
            .exec(callback);
        },
    }, function(err, results) {
        if (err) {return next(err);}
        if(results.genre == null) { // no results
            var err = new Error('Genre not found');
            err.status = 404;
            return next(err);
        }

        // Successful, so render
        res.render('genre_detail', {title: 'Genre Detail', genre: results.genre, genre_books: results.genre_books});
    });
};

// Display Genre create form on GET.
exports.genre_create_get = function(req, res) {
    res.render('genre_form', {title: 'Create Genre'});
};

// Handle Genre create on POST.
exports.genre_create_post = [
    body('name', 'Genre name required').isLength({ min: 1}).trim(),

    // Sanitize (escape) the name field.
    sanitizeBody('name').escape(),

    // Process request after validation errors from and sanitization
    (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a genre object with escaped and trimmed data
        var genre = new Genre(
            { name: req.body.name }
        );

        if (!errors.isEmpty()) {
            // There are errors. Render the form agaun with sanitized values/error messages
            res.render('genre_form', {
                title: 'Create Genre',
                genre: genre,
                errors: errors.array()
            });
            return;
        }
        else {
            // Data from form is valid
            // chech if Genre with same name already exists
            Genre.findOne( {'name': req.body.name })
                .exec( function(err, found_genre) {
                    if (err) {return next(err);}

                    if (found_genre) {
                        // Genre exists, redirect to its detail page.
                        res.redirect(found_genre.url);
                    }
                    else {
                        genre.save(function(err) {
                            // Genre saved. Redirect to genre detail page.
                            res.redirect(genre.url);
                        });
                    }
                });
        }
    } 
];

// Display Genre delete form on GET.
exports.genre_delete_get = function(req, res, next) {
    async.parallel({
        genre: function(callback) {
            Genre.findById(req.params.id).exec(callback);
        },
        genre_books: function(callback) {
            Book.find({'genre': req.params.id }).exec(callback);
        }
    }, function(err, results){
        if (err) { return next(err); }
        console.log(results.genre_books.length);
        if (results.genre == null ) {
            res.redirect('catalog/genres');
        }
        // Successful, so render.
        res.render('genre_delete', {title: 'Delete Genre', genre: results.genre, genre_books: results.genre_books});
    });
};

// Handle Genre delete on POST.
exports.genre_delete_post = function(req, res, next) {
    async.parallel({
        genre: function(callback) {
            Genre.findById(req.body.genreid).exec(callback);
        },
        genre_books: function(callback) {
            Book.find({'author': req.body.genreid }).exec(callback);
        },
    }, function(err, results) {
        if (err) {return next(err); }
        console.log(results.genre_books.length);
        if (results.genre_books.length > 0) {
            // Genre have books. Render in same ways a GET royte
            res.render('genre_delete', {title: 'Delete Genre', genre: results.genre, genre_books: results.genre_books});
            return;
        }
        else {
            Genre.findByIdAndDelete(req.body.genreid, function deleteGenre(err){
                if (err) { return next(err); }
                // Success. go to genres list
                res.redirect('/catalog/genres');
            })
        }
    })
};

// Display Genre update form on GET.
exports.genre_update_get = function(req, res, next) {
    Genre.findById(req.params.id).exec(function(err, result) {
        if(err) {return next(err);}
        if(result == null) {
            var err = new Error('Genre not found');
            err.status = 404;
            return next(err);
        }
        res.render('genre_form', {title: 'Update Genre', genre: result});
    })
};

// Handle Genre update on POST.
exports.genre_update_post = [
    body('name', 'Name must not be empty').isLength({min: 1}).trim(),
    sanitizeBody('name').escape(),
    (req, res, next) => {
        const errors = validationResult(req);

        var genre = new Genre(
            {
                name: req.body.name,
                _id: req.params.id
            });
        if(!errors.isEmpty()) {
            // There are aerros. Render form agaun with sanitized values/error messages.
            res.render('genre_form', {title: 'Update Genre', genre: genre, errors: errors.array()});
            return;
        }
        else {
            Genre.findByIdAndUpdate(req.params.id, genre, {}, function (err) {
                if (err) {return next(err);}

                // Succesfull - redirect to genre detail page.
                res.redirect(genre.url);
            })
        }
    }
];