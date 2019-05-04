var moment = require('moment');
let mongoose = require('mongoose');

let Schema = mongoose.Schema

var AuthorSchema = new Schema (
    {
        first_name: {type: String, required: true, max: 100},
        family_name: {type: String, required: true, max: 1000},
        date_of_birth: {type: Date},
        date_of_death: {type: Date}
    }
);

// Virtual fro author's full name
AuthorSchema
.virtual('name')
.get(function() {
    return this.family_name + ', ' + this.first_name;
});


// virtual for author's date of birth and death
AuthorSchema
.virtual('date_of_birth_formatted')
.get(function() {
  return (this.date_of_birth ? moment(this.date_of_birth).format('YYYY-MM-DD') : '');
});

AuthorSchema
.virtual('date_of_death_formatted')
.get(function() {
  return (this.date_of_death ? moment(this.date_of_death).format('YYYY-MM-DD') : '');
});


// Virtual for author's lifespan
AuthorSchema
.virtual('lifespan')
.get(function () {
  return (this.date_of_death.getYear() - this.date_of_birth.getYear()).toString();
});

// Virtual for author's URL
AuthorSchema
.virtual('url')
.get(function () {
  return '/catalog/author/' + this._id;
});

AuthorSchema
.virtual('lifespan_formatted')
.get(function () {
  return (`${this.date_of_birth ?  moment(this.date_of_birth).format('MMMM Do, YYYY') : ''} -
          ${this.date_of_death ? moment(this.date_of_death).format('MMMM Do, YYYY'): ''}`);
});

// Export model
module.exports = mongoose.model('Author', AuthorSchema);