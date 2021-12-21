import ItemGrabber from './Items'
import { writeFileSync, readFileSync } from 'fs'

const main = async () => {
    console.log('Quest Item Sheet Grabber')
    console.log('\n')

    const itemData = await ItemGrabber()

    const base = String(readFileSync('base.md')).toString()

    const output = `${base}\n${itemData.join('\n')}`
        .split('\n')
        .map((line) => {
            if (line.startsWith('            ')) return line.slice(12)
            else return line
        })
        .join('\n')

    writeFileSync('output.md', output)

    console.log('Wrote file to "output.md"')
}

main()
