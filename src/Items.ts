import RequestData from './Data'
import { CreateHyperlinks, GrabWikiPage } from './Utils'
import { readFileSync } from 'fs'

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

    let output: OutputArray[] = []

    for (const id in questItems) {
        const { count, quests } = questItems[id]
        const item = itemData[id]

        const shortName = item.shortName

        const wikiInfo = await WikiInfo(item)

        const markdown = `
            ## [${item.name}](${item.wikiLink})
            ${shortName} ${shortName[shortName.length - 1] === 's' ? 'are' : 'is'} used **${count}** time${
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


            ${wikiInfo.join('\n-    ')}
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

async function WikiInfo(item: Item) {
    if (Overrides[item.id] !== undefined) return Overrides[item.id]

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

        let output: string[] = []

        output = locationData
            .map((l) => {
                let line = l

                if (
                    line.startsWith('<') ||
                    line.startsWith('File:') ||
                    line.startsWith('{{') ||
                    line.startsWith('[') ||
                    line.startsWith('|') ||
                    line.startsWith('\uFEFF')
                ) {
                    return ''
                }

                if (line.startsWith('*')) line = line.slice(1)
                if (line.startsWith('* ')) line = line.slice(2)
                if (line.startsWith(' ')) line = line.slice(1)

                line = line.replace('{{PAGENAME}}', item.shortName)

                if (line.startsWith('===[')) line = line.slice(3) + line.slice(0, -3)

                if (line.includes('======')) {
                    line = line.slice(0, line.indexOf('======'))
                }

                return CreateHyperlinks(line)
            })
            .filter((l) => l !== '')

        return output
    } else {
        return ['No Special Locations']
    }
}
