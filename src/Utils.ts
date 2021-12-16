import axios from 'axios'

String.prototype.removeChar = function (index: number) {
    return this.slice(0, index) + this.slice(index + 1)
}

String.prototype.insert = function (content: string, index: number) {
    return [this.slice(0, index), content, this.slice(index)].join('')
}

export async function GrabWikiPage(pageTitle: string) {
    try {
        return await axios(
            `https://escapefromtarkov.fandom.com/api.php?action=query&prop=revisions&titles=${pageTitle}&rvprop=content&format=json`
        ).then(({ data }) => {
            const reponse = data as WikiResponse

            return Object.values(reponse.query.pages)[0].revisions[0]['*'].split('\n')
        })
    } catch {
        return null
    }
}

export function CreateHyperlinks(line: string) {
    let result = line

    while (result.includes('[[') && result.includes(']]')) {
        const start = result.indexOf('[[')
        const end = result.indexOf(']]')

        const mentionedItem = result
            .substring(start + 2, end)
            .replaceAll(' ', '_')
            .split('|')[0]

        result = result.removeChar(start)
        result = result.removeChar(end)

        result = result.insert(`(https://escapefromtarkov.fandom.com/wiki/${mentionedItem})`, end)
    }

    return result
}
