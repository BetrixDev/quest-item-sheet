// pull data from https://raw.githubusercontent.com/TarkovTracker/tarkovdata/master/quests.json
import ItemGrabber from './Items'
import { writeFileSync, readFileSync } from 'fs'

const main = async () => {
    const itemData = await ItemGrabber()

    const base = String(readFileSync('base.md')).toString()

    const output = `${base}\n${itemData.join('\n')}`.split('\n').map((line) => {
        if (line.startsWith('            ')) return line.slice(12)
        else return line
    }).join('\n')

    writeFileSync('output.md', output)
}

main()
