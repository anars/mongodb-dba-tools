const package = require("./package.json");
const gulp = require("gulp");
const strip = require("gulp-strip-comments");
const header = require("gulp-header");
const minify = require("gulp-uglify-es").default;
const rename = require("gulp-rename");
const replace = require("gulp-replace");

const top = (done) => gulp.src("top.js")
    .pipe(replace("#VERSION#", package.version))
    .pipe(replace("#YEAR#", new Date().getFullYear()))
    .pipe(strip())
    .pipe(minify())
    .pipe(header("#!/usr/bin/env node\n"))
    .pipe(rename("mongotopx"))
    .pipe(gulp.dest("./build"));

const stat = (done) => gulp.src("stat.js")
    .pipe(replace("#VERSION#", package.version))
    .pipe(replace("#YEAR#", new Date().getFullYear()))
    .pipe(strip())
    .pipe(minify())
    .pipe(header("#!/usr/bin/env node\n"))
    .pipe(rename("mongostatx"))
    .pipe(gulp.dest("./build"));

const license = (done) => gulp.src("license.txt")
    .pipe(replace("#VERSION#", package.version))
    .pipe(replace("#YEAR#", new Date().getFullYear()))
    .pipe(gulp.dest("./build"));

exports.default = gulp.series(top, stat, license);
