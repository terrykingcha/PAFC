var gulp = require('gulp');
var gutil = require('gulp-util');
var webpack = require('gulp-webpack');
var webpackConfigPC = require('./webpack.config.js');
var webpackConfigMobile = require('./mobile/webpack.config.js');
var uglifyjs = require('gulp-uglify');
var concat = require('gulp-concat');
var through2 = require('through2');
var path = require('path');
var fs = require('fs');
var cwd = process.cwd();

function webpackBundlePC(watch) {
    webpackConfigPC.watch = !!watch;

    return gulp.src('./src/main.js')
        .pipe(webpack(webpackConfigPC))
        .pipe(gulp.dest('./'));
}

function webpackBundleMobile(watch) {
    webpackConfigMobile.watch = !!watch;

    return gulp.src('./mobile/src/main.js')
        .pipe(webpack(webpackConfigMobile))
        .pipe(gulp.dest('./'));
}

gulp.task('webpack', [], function () {
    var bundlePC = webpackBundlePC(false);
    var bundleMobile = webpackBundleMobile(false);
    return Promise.all([bundlePC, bundleMobile]);});


gulp.task('watch', function() {
    var bundlePC = webpackBundlePC(true);
    var bundleMobile = webpackBundleMobile(true);
    return Promise.all([bundlePC, bundleMobile]);
});

function getComboSrcPC() {
    var htmlContent = fs.readFileSync('./index-dev.html').toString();
    var regExp = /\<script\s+src="([^"]+)"\>\<\/script\>/g;
    var srcPaths = [];
    var script;
    while (!!(script = regExp.exec(htmlContent))) {
        var srcPath = script[1];
        srcPaths.push(srcPath);
    }
    return srcPaths;
}

function getComboSrcMobile() {
    var htmlContent = fs.readFileSync('mobile/index-dev.html').toString();
    var regExp = /\<script\s+src="([^"]+)"\>\<\/script\>/g;
    var srcPaths = [];
    var script;
    while (!!(script = regExp.exec(htmlContent))) {
        var srcPath = script[1];
        srcPaths.push('mobile/' + srcPath);
    }
    return srcPaths;
}

gulp.task('dist', ['webpack'], function() {
    var srcPathsPC = getComboSrcPC();
    var pc = gulp.src(srcPathsPC)
        .pipe(concat('pafc.js'))
        // .pipe(uglifyjs())
        .pipe(gulp.dest('dist/'));


    var srcPathsMobile = getComboSrcMobile();
    var mobile = gulp.src(srcPathsMobile)
        .pipe(concat('pafc-mobile.js'))
        // .pipe(uglifyjs())
        .pipe(gulp.dest('mobile/dist/'));

    return Promise.all([pc, mobile]);
});

gulp.task('default', ['dist']);