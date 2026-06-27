import assert from "node:assert/strict";
import test from "node:test";

import {
  getDmAutoRouteAgentPubkeys,
  getThreadAutoRouteAgentPubkeys,
  mergeAutoRouteMentionPubkeys,
} from "./ChannelPane.helpers.ts";

function channel(overrides = {}) {
  return {
    id: "channel",
    name: "Channel",
    channelType: "stream",
    visibility: "open",
    description: "",
    topic: null,
    purpose: null,
    memberCount: 2,
    memberPubkeys: [],
    lastMessageAt: null,
    archivedAt: null,
    participants: [],
    participantPubkeys: [],
    isMember: true,
    ttlSeconds: null,
    ttlDeadline: null,
    ...overrides,
  };
}

test("DM composer auto-routes only when exactly one other participant is an agent", () => {
  const knownAgentPubkeys = new Set(["agent-one", "agent-two"]);

  assert.deepEqual(
    getDmAutoRouteAgentPubkeys({
      channel: channel({
        channelType: "dm",
        participantPubkeys: ["human", "agent-one"],
      }),
      currentPubkey: "human",
      knownAgentPubkeys,
    }),
    ["agent-one"],
  );

  assert.deepEqual(
    getDmAutoRouteAgentPubkeys({
      channel: channel({
        channelType: "dm",
        participantPubkeys: ["human", "agent-one", "agent-two"],
      }),
      currentPubkey: "human",
      knownAgentPubkeys,
    }),
    [],
  );

  assert.deepEqual(
    getDmAutoRouteAgentPubkeys({
      channel: channel({
        participantPubkeys: ["human", "agent-one"],
      }),
      currentPubkey: "human",
      knownAgentPubkeys,
    }),
    [],
  );
});

test("auto-routed mentions merge with explicit mentions without duplicates", () => {
  assert.deepEqual(
    mergeAutoRouteMentionPubkeys({
      autoRouteAgentPubkeys: ["AGENT-ONE"],
      mentionPubkeys: ["agent-one", "agent-two"],
    }),
    ["AGENT-ONE", "agent-two"],
  );
});

test("thread composer auto-routes exactly one current human and one known agent", () => {
  const knownAgentPubkeys = new Set(["agent-one", "agent-two"]);

  assert.deepEqual(
    getThreadAutoRouteAgentPubkeys({
      currentPubkey: "human",
      knownAgentPubkeys,
      messages: [
        { id: "root", pubkey: "human", tags: [["p", "agent-one"]] },
        { id: "reply", pubkey: "agent-one", tags: [] },
      ],
    }),
    ["agent-one"],
  );

  assert.deepEqual(
    getThreadAutoRouteAgentPubkeys({
      currentPubkey: "human",
      knownAgentPubkeys,
      messages: [
        { id: "root", pubkey: "human", tags: [["p", "agent-one"]] },
        { id: "reply", pubkey: "other-human", tags: [] },
      ],
    }),
    [],
  );

  assert.deepEqual(
    getThreadAutoRouteAgentPubkeys({
      currentPubkey: "human",
      knownAgentPubkeys,
      messages: [
        {
          id: "root",
          pubkey: "human",
          tags: [
            ["p", "agent-one"],
            ["p", "agent-two"],
          ],
        },
      ],
    }),
    [],
  );
});
