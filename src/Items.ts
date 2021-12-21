import RequestData from './Data'
import { CreateHyperlinks, FormatNumber, GrabWikiPage } from './Utils'
import { readFileSync } from 'fs'
import cliProgress from 'cli-progress'

const bar = new cliProgress.SingleBar({
    format: 'Gathering Items: {bar} - {value}/{total}',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
})

const Overrides = JSON.parse(String(readFileSync('overrides.json')).toString()) as Override

const ItemDependentObjectiveTypes = ['find', 'collect', 'place']

type QuestItemResult = {
    quests: Quest[]
    count: number
}

interface OutputArray extends QuestItemResult {
    markdown: string
}

export default async function (): Promise<string[]> {
    const [questData, itemData] = await RequestData()

    let questItems: { [key: string]: QuestItemResult } = {}

    questData.forEach((quest) => {
        quest.objectives.forEach((objective) => {
            if (ItemDependentObjectiveTypes.includes(objective.type)) {
                if (!objective.target.includes(' ')) {
                    // Removes quest specific items ie. 'False flash drive'
                    const itemCount = questItems[objective.target]

                    if (itemCount) {
                        questItems[objective.target] = {
                            count: itemCount.count + objective.number,
                            quests: [...itemCount.quests, quest]
                        }
                    } else {
                        questItems[objective.target] = { count: objective.number, quests: [quest] }
                    }
                }
            }
        })
    })

    bar.start(Object.keys(questItems).length, 0)

    let output: OutputArray[] = []

    for (const id in questItems) {
        bar.increment()

        const { count, quests } = questItems[id]
        const item = itemData[id]

        const shortName = item.shortName

        const wikiInfo = await WikiInfo(item)

        const markdown = `
            ## [${item.name}](${item.wikiLink})
            ${shortName} ${shortName[shortName.length - 1] === 's' ? 'are' : 'is'} needed **${FormatNumber(count)}** time${
            count === 1 ? '' : 's'
        } in the following quests:

            ${quests
                .map((quest) => {
                    return `- [${quest.title}](${quest.wiki})`
                })
                .join('\n')}

            <br>

            <details>
            <summary>Where to find this item?</summary>


            ${wikiInfo.length > 2 ? '-   General' : ''}
            ${wikiInfo.join('\n')}
            </details>
        `

        output.push({ count, quests, markdown })
    }

    return output
        .sort((a, b) => {
            return b.count - a.count
        })
        .map((obj) => {
            return obj.markdown
        })
}

/**Scrapes and extracts text from the wiki*/
async function WikiInfo(item: Item) {
    if (Overrides[item.name] !== undefined) return Overrides[item.name].map((line) => CreateHyperlinks(line))

    const wikiTitle = item.wikiLink.replace('https://escapefromtarkov.fandom.com/wiki/', '')

    const wikiPage = await GrabWikiPage(wikiTitle)

    if (wikiPage) {
        let locationData = wikiPage.slice(wikiPage.indexOf('==Location==') + 1)

        locationData.forEach((line, i) => {
            if (line.startsWith('==') && !line.startsWith('===[')) {
                locationData = locationData.slice(0, i)
            }
        })

        if (locationData[0].startsWith('{{Infobox')) {
            return ['No Special Locations']
        }

        return locationData
            .filter((line) => {
                // Only give us lines that have useful information
                return line.startsWith('*') || line.startsWith('===[[')
            })
            .map((l) => {
                let line = l

                if (line.startsWith('*')) {
                    // Bulleted location on the map
                    line = line.replace('* ', '').replace('*', '')
                    line = `    -   ${line}`
                } else if (line.startsWith('===')) {
                    // Name of map
                    line = line.replace('===', '').replace('===', '')
                    line = `-   ${line}`
                }

                // {{PAGENAME}} is a variable for the items name so we use it as such
                line = line.replaceAll('{{PAGENAME}}', item.shortName)

                // Remove excess HTML tags
                line = line.replaceAll('<[^>]*>', '')

                return CreateHyperlinks(line)
            })
            .filter((l) => l !== '')
    } else {
        return ['No Special Locations']
    }
}
