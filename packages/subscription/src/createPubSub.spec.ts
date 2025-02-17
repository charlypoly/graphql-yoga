import { createPubSub } from './createPubSub'

async function collectAsyncIterableValues<TType>(
  asyncIterable: AsyncIterable<TType>,
): Promise<Array<TType>> {
  const values: Array<TType> = []
  for await (const value of asyncIterable) {
    values.push(value)
  }
  return values
}

if (!globalThis.EventTarget || !globalThis.Event) {
  require('event-target-polyfill')
}

describe('createPubSub', () => {
  it('create', () => {
    createPubSub()
  })
  it('subscribe to topic', async () => {
    const pubSub = createPubSub<{
      a: [number]
    }>()

    const sub = pubSub.subscribe('a')
    const allValues = collectAsyncIterableValues(sub)
    pubSub.publish('a', 1)
    pubSub.publish('a', 2)
    pubSub.publish('a', 3)

    setImmediate(() => {
      sub.return()
    })

    const result = await allValues
    expect(result).toEqual([1, 2, 3])
  })
  it('subscribe to multiple topics', async () => {
    const pubSub = createPubSub<{
      a: [number]
      b: [string]
    }>()

    const sub1 = pubSub.subscribe('a')
    const sub2 = pubSub.subscribe('b')
    const allValues1 = collectAsyncIterableValues(sub1)
    const allValues2 = collectAsyncIterableValues(sub2)

    pubSub.publish('a', 1)
    pubSub.publish('b', '1')
    pubSub.publish('a', 2)
    pubSub.publish('b', '2')
    pubSub.publish('a', 3)
    pubSub.publish('b', '3')

    setImmediate(() => {
      sub1.return()
      sub2.return()
    })

    const result1 = await allValues1
    const result2 = await allValues2
    expect(result1).toEqual([1, 2, 3])
    expect(result2).toEqual(['1', '2', '3'])
  })
  it('subscribe to fine-grained topic', async () => {
    const pubSub = createPubSub<{
      a: [id: string, payload: number]
    }>()
    const id1 = '1'
    const sub1 = pubSub.subscribe('a', id1)
    const allValues1 = collectAsyncIterableValues(sub1)
    pubSub.publish('a', id1, 1)
    pubSub.publish('a', id1, 2)
    pubSub.publish('a', id1, 3)
    setImmediate(() => {
      sub1.return()
    })

    const result1 = await allValues1
    expect(result1).toEqual([1, 2, 3])
  })
  it('subscribe to multiple fine-grained topics', async () => {
    const pubSub = createPubSub<{
      a: [id: string, payload: number]
      b: [id: string, payload: string]
    }>()
    const id1 = '1'
    const id2 = '1'

    const sub1 = pubSub.subscribe('a', id1)
    const sub2 = pubSub.subscribe('b', id2)

    const allValues1 = collectAsyncIterableValues(sub1)
    const allValues2 = collectAsyncIterableValues(sub2)

    pubSub.publish('a', id1, 1)
    pubSub.publish('b', id1, '1')
    pubSub.publish('a', id1, 2)
    pubSub.publish('b', id1, '2')
    pubSub.publish('a', id1, 3)
    pubSub.publish('b', id1, '3')
    setImmediate(() => {
      sub1.return()
      sub2.return()
    })

    const result1 = await allValues1
    const result2 = await allValues2
    expect(result1).toEqual([1, 2, 3])
    expect(result2).toEqual(['1', '2', '3'])
  })
})
