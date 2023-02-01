import * as dotenv from "dotenv";
import { Course, fetchPupp } from "./puppeteer";
import ics, { EventAttributes } from "ics";
import { writeFileSync } from "fs";
import puppeteer from "puppeteer";

dotenv.config();

export async function main() {
	console.log("start")
	const date = new Date();
	const monthLimit = date.getMonth() + 4
	let timetables: Course[] = [];
	// open the headless browser
	const browser = await puppeteer.launch({ headless: true, executablePath: process.env["PUPPETEER_EXECUTABLE_PATH"] });
	// open a new page
	let page = await browser.newPage();	
	while (date.getMonth() !== monthLimit) {
		console.log("in progress")
		const timetable = await fetchPupp(date, page);
		if (timetable) timetables = timetables.concat(timetable);
		date.setDate(date.getDate() + 7);
	}
	console.log(timetables)
	await createCalendar(timetables);
	console.log("done")
	// exit();
}

function createCalendar(courses: Course[]) {
	const events: EventAttributes[] = courses.map(({ name, classroom, teacher, startTimestamp, endTimestamp }) => {
		const start: Date = new Date(startTimestamp);
		const end: Date = new Date(endTimestamp);
		return {
			start: [start.getFullYear(), start.getMonth() + 1, start.getDate(), start.getHours(), start.getMinutes()],
			end: [end.getFullYear(), end.getMonth() + 1, end.getDate(), end.getHours(), end.getMinutes()],
			title: name,
			description: `${teacher} - ${classroom}`,
		};
	});
	console.log(events)
	ics.createEvents(events, (error, value) => {
		if (error) {
			console.log(error);
		}
		writeFileSync(`${process.cwd()}/ics/event.ics`, value);
	});
}

// main();