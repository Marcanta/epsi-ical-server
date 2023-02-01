'use strict';

import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import sanitizeFilename from "sanitize-filename";
import fileUpload from "express-fileupload";
import cron from "node-cron";
import path from "path";
import { main } from "./core";
import { existsSync, rmSync } from "fs";

const app = express()
const port = 3000

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

//  apply to all requests
app.use(limiter);

app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 }, //50 MB file size limit
}));

app.use(helmet());

if (!existsSync(`${process.cwd()}/ics/event.ics`)) {
  main();
}

cron.schedule('0 0 * * SUN', () => {
  console.log("CRON")
  rmSync(`${process.cwd()}/ics/event.ics`)
  main();
});

app.get('/calendar', (_, res) => {
  res.send('Welcome to the good epsi calendar!')
})

app.get('/calendar/event.ics', function (_, res, next) {
  var options = {
    root: path.join(process.cwd(), 'ics'),
    dotfiles: 'deny',
    headers: {
      'x-timestamp': Date.now(),
      'x-sent': true
    }
  }
  
  var fileName = "event.ics"
  fileName = sanitizeFilename(fileName);

  res.sendFile(fileName, options, function (err) {
    if (err) {
      next(err)
    } else {
      console.log('Sent:', fileName)
    }
  })
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})