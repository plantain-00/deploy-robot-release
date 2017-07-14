"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
exports.express = express;
const crypto = require("crypto");
exports.crypto = crypto;
const childProcess = require("child_process");
const request = require("request");
exports.request = request;
const bodyParser = require("body-parser");
exports.bodyParser = bodyParser;
const minimist = require("minimist");
exports.minimist = minimist;
const fs = require("fs");
function exec(command) {
    return new Promise((resolve, reject) => {
        childProcess.exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            }
            else {
                resolve();
            }
        });
    });
}
exports.exec = exec;
const getPort = require("get-port");
exports.getPort = getPort;
function readAsync(filename) {
    return new Promise((resolve, reject) => {
        fs.readFile(filename, "utf8", (error, data) => {
            if (error) {
                reject(error);
            }
            else {
                resolve(data);
            }
        });
    });
}
exports.readAsync = readAsync;
function writeAsync(filename, data) {
    return new Promise((resolve, reject) => {
        fs.writeFile(filename, data, error => {
            if (error) {
                reject(error);
            }
            else {
                resolve();
            }
        });
    });
}
exports.writeAsync = writeAsync;
