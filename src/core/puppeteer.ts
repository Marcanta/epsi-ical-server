import puppeteer, { Browser, Page } from "puppeteer";

export async function fetchPupp(date: Date = new Date(), page: Page): Promise<Course[] | undefined> {
	let browser: Browser;
	try {
		// enter url in page
		await page.goto(
			`https://edtmobiliteng.wigorservices.net//WebPsDyn.aspx?action=posEDTBEECOME&serverid=C&Tel=${
				process.env.USERNAME
			}&date=${date.toLocaleDateString("en-US")}`
		);

		let formatedValue = await page.evaluate(casesToArray);

		// check if the formatedValue is empty
		const data = Object.values(formatedValue).flat();
		const empty = data.filter(t => Object.keys(t).length !== 0).length;

		if (!empty) {
			if (await page.evaluate(() => document.getElementsByTagName("h1")[0]?.innerHTML === "Erreur de parametres")) {
				throw new Error("Epsi's calendar crashed.")
			}
			return undefined;
		}

		const flattenedCourses = addTimestampToCourses(formatedValue, date);

		return flattenedCourses;
	} catch (err) {
		console.log(err);
		await browser!.close();
		console.error("Browser Closed");
	}
}

function casesToArray(): TimelessCourses {
	const cases = Array.from(document.getElementsByClassName("Case")) as Array<HTMLElement>;
	let res: TimelessCourses = {};
	for (const oneCase of cases) {
		const teacher = oneCase.getElementsByClassName("TCProf")[0]?.innerHTML.split("<br>")[0].split("</span>")[1];
		const classroom = oneCase.getElementsByClassName("TCSalle")[0]?.innerHTML;
		const hour = oneCase.getElementsByClassName("TChdeb")[0]?.innerHTML;
		const name = oneCase.getElementsByTagName("td")[0]?.innerText;
		const pos = oneCase?.style.left.replace("%", "").split(".")[0];
		if (!(teacher && classroom && hour && name)) continue;
		if (pos in res) {
			res[pos].push({ teacher, classroom, hour, name });
		} else {
			res[pos] = [{ teacher, classroom, hour, name }];
		}
	}
	return res;
}

function addTimestampToCourses(courses: TimelessCourses, date: Date): Course[] {
	const mondayDate = new Date(date.getTime());
	mondayDate.setDate(mondayDate.getDate() - (mondayDate.getDay() || 7) + 1);
	const iterableCourses = Object.values(courses);
	if (iterableCourses.length > 5) iterableCourses.pop();
	return iterableCourses
		.map((courses, index) => {
			if (index !== 0) mondayDate.setDate(mondayDate.getUTCDate() + 1);
			return courses.map(course => {
				const [start, end] = course.hour.split(" - ");
				const [startHour, startMinutes] = start.split(":");
				const [endHour, endMinutes] = end.split(":");
				return {
					...course,
					startTimestamp: mondayDate.setHours(+startHour, +startMinutes),
					endTimestamp: mondayDate.setHours(+endHour, +endMinutes),
				};
			});
		})
		.flat();
}

export type Course = {
	startTimestamp: number;
	endTimestamp: number;
	teacher: string;
	classroom: string;
	hour: string;
	name: string;
};
export type TimelessCourses = { [x: string]: Omit<Course, "startTimestamp" | "endTimestamp">[] };
