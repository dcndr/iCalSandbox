import $, { type } from 'jquery'
import ical from 'ical'
import './index.css'

const fileInput: JQuery<HTMLInputElement> = $('#fileInput')
const todayButton: JQuery<HTMLButtonElement> = $('#todayButton')
const weekButton: JQuery<HTMLButtonElement> = $('#weekButton')
const eventsList: JQuery<HTMLDivElement> = $('#events')
const fileInputFakeButton: JQuery<HTMLButtonElement> = $('#fileInputFakeButton')
const todayHeader: JQuery<HTMLTableCellElement> = $('#todayHeader')
const weekHeader: JQuery<HTMLTableCellElement> = $('#weekHeader')
enum Mode { None, Today, Week }
let mode = Mode.None;

type ClassRow = {
    class: string
    teacher: string
    room: string
    period: string
    start: string
    end: string
}

const eventToClass = (event: ical.CalendarComponent): ClassRow => {
    const summaryRegex = /.+: ((Yr \d+)|(Rec)) ([^(\n]+)./

    const descriptionRegex = /Teacher:  (.+)\nPeriod: Period (.+)/
    const descriptionMatches = Array.from(
        event.description!.match(descriptionRegex)!
    )

    const locationRegex = /Room: (.+)/
    const locationMatches = Array.from(
        event.location!.match(locationRegex)!
    )

    return {
        class: Array.from(
            event.summary!.match(summaryRegex)!
        )[4],
        teacher: descriptionMatches[1],
        room: locationMatches[1].startsWith('Gymnasium') ? 'Gymnasium' : locationMatches[1],
        period: descriptionMatches[2],
        start: new Date(event.start!).toLocaleTimeString(),
        end: new Date(event.end!).toLocaleTimeString(),
    }
}
const getFileName = (path: string | number | string[]): string => {
    const fileRegex = /\\([^\\]+)$/
    return (path as string).match(fileRegex)![1]
}
fileInput.on('change', () => {
    const fileRegex = /\\([^\\]+)$/
    todayButton.prop('disabled', !fileInput.val())
    weekButton.prop('disabled', !fileInput.val())
    fileInputFakeButton.html(`Selected file: <code class="bg-violet-300 rounded-md p-1 group-hover:bg-violet-600 text-violet-600 group-hover:text-violet-100 transition">${getFileName(fileInput.val()!)}</code>`)
    todayButton.trigger('click')
})
fileInputFakeButton.on('click', () => {
    fileInput.trigger('click')
})
todayButton.on('click', () => {
    mode = Mode.Today
    updateTable()
})
weekButton.on('click', () => {
    mode = Mode.Week
    updateTable()
})
const showTable = () => {
    eventsList.empty()
    eventsList.parent().removeClass('opacity-0 duration-0')
    eventsList.parent().addClass('duration-1000')
}
const updateButtons = () => {
    const style = 'shadow-inner'
    switch (mode) {
        case Mode.None:
            todayButton.removeClass(style)
            weekButton.removeClass(style)
            break
        case Mode.Today:
            todayButton.addClass(style)
            weekButton.removeClass(style)
            break
        case Mode.Week:
            todayButton.removeClass(style)
            weekButton.addClass(style)
            break
    }
}
const updateHeaders = () => {
    switch (mode) {
        case Mode.None:
            todayHeader.hide()
            weekHeader.hide()
            break
        case Mode.Today:
            todayHeader.show()
            weekHeader.hide()
            break
        case Mode.Week:
            todayHeader.hide()
            weekHeader.show()
            break
    }
}
const dataToEvents = (data: string) => {
    const calendar = ical.parseICS(data)
    const events = Object.entries(calendar)
        .filter(entry => calendar[entry[0]].type.toString() === 'VEVENT')
        .map(entry => entry[1])
    return events
}

const getWeekNumber = (date: Date) => {
    date = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo;
}

const updateTable = () => {
    updateButtons()
    updateHeaders()
    if (!fileInput.val()) return
    const file: File = fileInput.prop('files')[0]
    showTable()
    file.text().then((data) => {
        const events = dataToEvents(data).filter(event => event.type.toString() === 'VEVENT')
        if (localStorage.getItem('events') !== JSON.stringify(events)) {
            localStorage.setItem('events', JSON.stringify(events))
        }
        if (localStorage.getItem('filename') !== getFileName(fileInput.val()!)) {
            localStorage.setItem('filename', getFileName(fileInput.val()!))
        }
        if (mode == Mode.Today) {
            events.forEach((event) => {
                if (event.type.toString() === 'VEVENT' && event.start?.getDate() === new Date().getDate()) {
                    const classRow = eventToClass(event)
                    eventsList.append($(
                        `
                            <tr class='h-16 border-y border-y-violet-200 hover:bg-violet-100 transition duration-700'>
                                <td>${classRow.class}</td>
                                <td class='hidden md:table-cell'>
                                    ${classRow.teacher.replace(/\w\S*/g, word => word.charAt(0).toUpperCase() + word.substring(1).toLowerCase())}
                                </td>
                                <td>${classRow.room.toString()}</td>
                                <td>${classRow.period}</td>
                                <td class='hidden sm:block'>${classRow.start}</td>
                                <td class='hidden sm:block'>${classRow.end}</td>
                            </tr>
                        `
                    ))
                }
            })
        }
        else {
            const week = eventsToWeek(events.filter(event => getWeekNumber(event.start!) === getWeekNumber(new Date())))
            eventsList.append($(
                week
            ))
        }
    })
}
const eventsToWeek = (events: ical.CalendarComponent[]) =>
    [...Array(8).keys()]
        .map(period => `
            <tr class='h-16 border-y border-y-violet-200 hover:bg-violet-100 transition duration-700'>
                ${events
                .filter(event => eventToClass(event).period === (period + 1).toString())
                .map(event => `<td>${eventToClass(event).class}</td>`)}
            </tr>
        `).join('')

if (localStorage.getItem('events')) {
    const events = JSON.parse(localStorage.getItem('events')!)
    eventsList.append($(
        eventsToWeek(events)
    ))
    fileInput.trigger('change')
}
