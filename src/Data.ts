import { request, gql } from 'graphql-request'
import axios from 'axios'

const itemQuery = gql`
    {
        itemsByType(type: any) {
            id
            name
            shortName
            wikiLink
        }
    }
`

export default async function (): Promise<[Quest[], { [key: string]: Item }]> {
    const questData = await axios
        .get<Quest[]>('https://raw.githubusercontent.com/TarkovTracker/tarkovdata/master/quests.json')
        .then(({ data }) => {
            return data
        })

    const itemResponse = await request('https://tarkov-tools.com/graphql', itemQuery).then((res) => res.itemsByType)

    let obj: { [key: string]: Item } = {}

    const itemData = itemResponse as Item[]

    itemData.forEach((item) => {
        obj[item.id] = { ...item }
    })

    return [questData, obj]
}
