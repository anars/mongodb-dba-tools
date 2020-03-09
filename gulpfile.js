const package = require("./package.json");
const gulp = require("gulp");
const del = require("del");
const strip = require("gulp-strip-comments");
const header = require("gulp-header");
const minify = require("gulp-uglify-es").default;

const buildPath = "build/";

const clean = (done) => {
  del.sync(buildPath);
  done();
};

const distTop = (done) => gulp.src("top.js")
    .pipe(strip())
    .pipe(minify())
    .pipe(header("#!/usr/bin/env node\n"))
    .pipe(gulp.dest(buildPath));

const buildTop = (done) => gulp.src("top.js")
    .pipe(strip())
    .pipe(header("#!/usr/bin/env node\n"))
    .pipe(gulp.dest(buildPath));

exports.clean = gulp.series(clean);

exports.build = gulp.series(exports.clean, buildTop);

exports.dist = gulp.series(exports.clean, distTop);

exports.default = (done) => {
  console.log(`\n* * * Available tasks: ${Object.keys(exports)} * * *\n`);
  return done();
};