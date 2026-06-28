import {
  truthOrDareCategories,
  truthOrDareCategoryIds,
} from "@/features/truth-or-dare/defaults";
import type {
  TruthOrDareCategoryId,
  TruthOrDarePrompt,
  TruthOrDarePromptType,
} from "@/features/truth-or-dare/types";

type Labels = readonly [en: string, uk: string];
type TextFactory = (topic: Labels) => Labels;

interface CategoryContentSeed {
  dareTopics: readonly Labels[];
  truthTopics: readonly Labels[];
}

const truthTemplates: readonly TextFactory[] = [
  ([en, uk]) => [`Tell the group about ${en}.`, `Розкажи компанії про ${uk}.`],
  ([en, uk]) => [
    `What is the real story behind ${en}?`,
    `Яка справжня історія про ${uk}?`,
  ],
  ([en, uk]) => [
    `Who here would you connect with ${en}, and why?`,
    `Кого тут ти пов'язуєш із ${uk} і чому?`,
  ],
  ([en, uk]) => [
    `Rate your confidence about ${en} from 1 to 10.`,
    `Оціни свою впевненість щодо ${uk} від 1 до 10.`,
  ],
  ([en, uk]) => [
    `What detail about ${en} would surprise this group?`,
    `Яка деталь про ${uk} здивувала б цю компанію?`,
  ],
  ([en, uk]) => [
    `What is the most recent example of ${en} in your life?`,
    `Який найсвіжіший приклад ${uk} у твоєму житті?`,
  ],
  ([en, uk]) => [
    `What would you change if ${en} happened tonight?`,
    `Що б ти змінив/змінила, якби ${uk} сталося сьогодні?`,
  ],
  ([en, uk]) => [
    `What is your boldest opinion about ${en}?`,
    `Яка твоя найсміливіша думка про ${uk}?`,
  ],
  ([en, uk]) => [
    `What is the funniest thing you can admit about ${en}?`,
    `Що найсмішніше ти можеш визнати про ${uk}?`,
  ],
  ([en, uk]) => [
    `What is the one detail you usually leave out when talking about ${en}?`,
    `Яку одну деталь ти зазвичай пропускаєш, коли говориш про ${uk}?`,
  ],
  ([en, uk]) => [
    `Who would be most shocked by your answer about ${en}?`,
    `Хто найбільше здивувався б твоїй відповіді про ${uk}?`,
  ],
  ([en, uk]) => [
    `What lesson did you learn from ${en}?`,
    `Який урок ти виніс/винесла з ${uk}?`,
  ],
  ([en, uk]) => [
    `What would you never want your parents to hear about ${en}?`,
    `Що про ${uk} ти точно не хотів/хотіла б розповідати батькам?`,
  ],
  ([en, uk]) => [
    `What would your best friend say about ${en}?`,
    `Що твій найкращий друг або подруга сказали б про ${uk}?`,
  ],
  ([en, uk]) => [
    `What part of ${en} makes you feel most exposed?`,
    `Яка частина теми про ${uk} змушує тебе почуватися найбільш відкрито?`,
  ],
  ([en, uk]) => [
    `What is the most honest answer you can give about ${en}?`,
    `Яку найчеснішу відповідь ти можеш дати про ${uk}?`,
  ],
  ([en, uk]) => [
    `If the group voted, what would they guess about ${en}?`,
    `Якби компанія голосувала, що б вона припустила про ${uk}?`,
  ],
];

const dareTemplates: readonly TextFactory[] = [
  ([en, uk]) => [`Do this now: ${en}.`, `Зроби це зараз: ${uk}.`],
  ([en, uk]) => [
    `Let the group count down from five, then ${en}.`,
    `Нехай компанія дорахує до п'яти, а потім ${uk}.`,
  ],
  ([en, uk]) => [`Make it bold: ${en}.`, `Зроби це сміливо: ${uk}.`],
  ([en, uk]) => [
    `For the next 30 seconds, ${en}.`,
    `Протягом наступних 30 секунд ${uk}.`,
  ],
  ([en, uk]) => [
    `Before your next turn, ${en}.`,
    `До свого наступного ходу ${uk}.`,
  ],
  ([en, uk]) => [
    `Choose one player to judge how well you ${en}.`,
    `Обери одного гравця, який оцінить, наскільки добре ти ${uk}.`,
  ],
  ([en, uk]) => [
    `Do a confident version of this: ${en}.`,
    `Зроби впевнену версію цього: ${uk}.`,
  ],
  ([en, uk]) => [
    `Do a deliberately terrible version of this: ${en}.`,
    `Зроби навмисно жахливу версію цього: ${uk}.`,
  ],
  ([en, uk]) => [
    `Let the player on your right add one condition, then ${en}.`,
    `Нехай гравець праворуч додасть одну умову, а потім ${uk}.`,
  ],
  ([en, uk]) => [
    `Repeat this until someone smiles: ${en}.`,
    `Повторюй це, доки хтось не усміхнеться: ${uk}.`,
  ],
  ([en, uk]) => [`Do this silently: ${en}.`, `Зроби це мовчки: ${uk}.`],
  ([en, uk]) => [
    `Do this like you are in a serious movie scene: ${en}.`,
    `Зроби це так, ніби ти в серйозній сцені фільму: ${uk}.`,
  ],
  ([en, uk]) => [
    `Do this while everyone gives you a drumroll: ${en}.`,
    `Зроби це, поки всі створюють барабанний дріб: ${uk}.`,
  ],
  ([en, uk]) => [
    `Ask the group for a style, then ${en}.`,
    `Попроси компанію обрати стиль, а потім ${uk}.`,
  ],
  ([en, uk]) => [
    `Do this as if you are teaching a masterclass: ${en}.`,
    `Зроби це так, ніби проводиш майстер-клас: ${uk}.`,
  ],
  ([en, uk]) => [
    `Do this and keep a straight face: ${en}.`,
    `Зроби це й збережи серйозний вираз обличчя: ${uk}.`,
  ],
  ([en, uk]) => [
    `Let the group choose your opening line, then ${en}.`,
    `Нехай компанія обере твою першу фразу, а потім ${uk}.`,
  ],
  ([en, uk]) => [
    `Do this in slow motion: ${en}.`,
    `Зроби це в уповільненому темпі: ${uk}.`,
  ],
  ([en, uk]) => [
    `Do this with maximum dramatic commitment: ${en}.`,
    `Зроби це з максимальною драматичною віддачею: ${uk}.`,
  ],
  ([en, uk]) => [
    `Do this, then nominate someone to rate it from 1 to 10: ${en}.`,
    `Зроби це, а потім обери когось, хто оцінить від 1 до 10: ${uk}.`,
  ],
  ([en, uk]) => [
    `Do this as your final audition for the party: ${en}.`,
    `Зроби це як фінальне прослуховування для цієї вечірки: ${uk}.`,
  ],
];

const contentSeeds: Record<TruthOrDareCategoryId, CategoryContentSeed> = {
  fun: {
    truthTopics: [
      [
        "your most ridiculous party habit",
        "свою найбезглуздішу вечіркову звичку",
      ],
      [
        "the nickname you secretly deserve",
        "прізвисько, яке ти таємно заслужив/заслужила",
      ],
      [
        "the funniest misunderstanding you caused",
        "найсмішніше непорозуміння, яке ти спричинив/спричинила",
      ],
      [
        "your least impressive hidden talent",
        "свій найменш вражаючий прихований талант",
      ],
      [
        "the song that instantly changes your mood",
        "пісню, яка миттєво змінює твій настрій",
      ],
      [
        "the snack you would defend in court",
        "снек, який ти захищав/захищала б у суді",
      ],
      [
        "your most chaotic travel story",
        "свою найхаотичнішу історію з подорожі",
      ],
      [
        "the outfit choice you cannot explain",
        "вибір одягу, який ти не можеш пояснити",
      ],
      [
        "the emoji that describes your week",
        "емодзі, який описує твій тиждень",
      ],
      [
        "the harmless rule you always break",
        "нешкідливе правило, яке ти завжди порушуєш",
      ],
    ],
    dareTopics: [
      [
        "perform a dramatic victory pose",
        "зроби драматичну позу переможця/переможниці",
      ],
      [
        "invent a handshake with the player on your left",
        "вигадай рукостискання з гравцем ліворуч",
      ],
      ["speak like a game-show host", "говори як ведучий/ведуча телешоу"],
      [
        "mime making your favorite snack",
        "пантомімою покажи приготування улюбленого снеку",
      ],
      [
        "give everyone a silly royal title",
        "дай кожному смішний королівський титул",
      ],
      ["dance without moving your feet", "танцюй, не рухаючи ступнями"],
      [
        "sell an invisible product to the group",
        "продай компанії невидимий товар",
      ],
      [
        "make a serious toast to a random object nearby",
        "серйозно виголоси тост за випадковий предмет поруч",
      ],
    ],
  },
  soft: {
    truthTopics: [
      ["a compliment you still remember", "комплімент, який ти досі пам'ятаєш"],
      [
        "a small fear you are learning to handle",
        "маленький страх, з яким ти вчишся справлятися",
      ],
      [
        "the friend quality you value most",
        "якість друга, яку ти цінуєш найбільше",
      ],
      ["a habit that makes you feel calm", "звичку, яка тебе заспокоює"],
      [
        "a moment when you felt proud recently",
        "момент, коли ти нещодавно пишався/пишалася собою",
      ],
      [
        "the kind of support you rarely ask for",
        "підтримку, про яку ти рідко просиш",
      ],
      [
        "a memory that always feels warm",
        "спогад, який завжди здається теплим",
      ],
      [
        "the person who taught you patience",
        "людину, яка навчила тебе терпіння",
      ],
      ["a boundary that helped you", "межу, яка тобі допомогла"],
      [
        "the version of yourself you miss sometimes",
        "версію себе, за якою ти іноді сумуєш",
      ],
    ],
    dareTopics: [
      [
        "give a sincere compliment to two players",
        "зроби щирий комплімент двом гравцям",
      ],
      [
        "let someone choose a kind nickname for you",
        "дозволь комусь обрати для тебе добре прізвисько",
      ],
      [
        "share one calming breath with the group",
        "зроби один спокійний вдих разом із компанією",
      ],
      [
        "thank someone here for a small thing",
        "подякуй комусь тут за маленьку річ",
      ],
      [
        "hold a serious smile until someone laughs",
        "тримай серйозну усмішку, доки хтось не засміється",
      ],
      ["describe the group as a movie genre", "опиши компанію як жанр фільму"],
      [
        "choose a player and say what they do well",
        "обери гравця й скажи, що в нього/неї добре виходить",
      ],
      [
        "make a tiny promise you can keep tonight",
        "дай маленьку обіцянку, яку можеш виконати сьогодні",
      ],
    ],
  },
  hot: {
    truthTopics: [
      ["your most obvious flirting tell", "свою найпомітнішу ознаку флірту"],
      [
        "the kind of confidence you find attractive",
        "тип упевненості, який тебе приваблює",
      ],
      [
        "a crush you handled badly",
        "симпатію, з якою ти невдало впорався/впоралася",
      ],
      [
        "the compliment that makes you blush",
        "комплімент, від якого ти червонієш",
      ],
      [
        "your go-to move when you want attention",
        "свій звичний хід, коли хочеш уваги",
      ],
      [
        "the most tempting bad idea you had",
        "найспокусливішу погану ідею, яка в тебе була",
      ],
      [
        "the first thing you notice in someone's style",
        "перше, що ти помічаєш у чиємусь стилі",
      ],
      [
        "a romantic scene you secretly like",
        "романтичну сцену, яка тобі таємно подобається",
      ],
      [
        "the text you wanted to send but did not",
        "повідомлення, яке ти хотів/хотіла надіслати, але не надіслав/надіслала",
      ],
      [
        "the person here with the strongest charm",
        "людину тут із найсильнішою харизмою",
      ],
    ],
    dareTopics: [
      [
        "give your best harmless flirt to the room",
        "покажи компанії свій найкращий безпечний флірт",
      ],
      [
        "hold eye contact with the player opposite you",
        "утримуй зоровий контакт із гравцем навпроти",
      ],
      [
        "read a dramatic romantic line to the group",
        "прочитай компанії драматичну романтичну фразу",
      ],
      [
        "choose someone and describe their party aura",
        "обери когось і опиши його/її вечіркову ауру",
      ],
      [
        "walk across the room like you own it",
        "пройди кімнатою так, ніби вона твоя",
      ],
      [
        "let the group pick your imaginary dating-app bio",
        "дозволь компанії вигадати твій уявний опис для дейтинг-додатка",
      ],
      [
        "say a bold compliment without smiling",
        "скажи сміливий комплімент і не усміхайся",
      ],
      [
        "pose like the cover of a romance novel",
        "стань у позу з обкладинки романтичного роману",
      ],
    ],
  },
  hard: {
    truthTopics: [
      [
        "a decision you avoided for too long",
        "рішення, якого ти занадто довго уникав/уникала",
      ],
      [
        "the apology you still owe someone",
        "вибачення, яке ти досі комусь винен/винна",
      ],
      ["a time your ego got in the way", "момент, коли твоє его завадило"],
      [
        "the rumor you wish you had corrected",
        "чутку, яку ти хотів/хотіла б виправити",
      ],
      [
        "the habit people call you out for",
        "звичку, за яку тебе часто критикують",
      ],
      ["a truth you tell too late", "правду, яку ти кажеш занадто пізно"],
      [
        "the friendship mistake you learned from",
        "помилку в дружбі, з якої ти зробив/зробила висновок",
      ],
      [
        "the pressure you put on yourself",
        "тиск, який ти сам/сама на себе накладаєш",
      ],
      [
        "a boundary you crossed by accident",
        "межу, яку ти випадково перетнув/перетнула",
      ],
      [
        "the brave conversation you keep postponing",
        "сміливу розмову, яку ти відкладаєш",
      ],
    ],
    dareTopics: [
      [
        "let the group ask one follow-up question",
        "дозволь компанії поставити одне уточнювальне питання",
      ],
      [
        "name one habit you will pause for the next hour",
        "назви одну звичку, яку поставиш на паузу на годину",
      ],
      [
        "give a one-minute honest toast about growth",
        "виголоси хвилинний чесний тост про розвиток",
      ],
      [
        "ask someone here for direct feedback",
        "попроси когось тут про прямий відгук",
      ],
      [
        "sit silently while the group gives you a challenge",
        "мовчи, поки компанія дає тобі виклик",
      ],
      [
        "admit one small thing you exaggerated",
        "визнай одну дрібницю, яку ти перебільшив/перебільшила",
      ],
      [
        "choose a player and ask what they misunderstood about you",
        "обери гравця й запитай, що він/вона неправильно зрозумів/зрозуміла про тебе",
      ],
      [
        "make a short speech defending your worst opinion",
        "виголоси коротку промову на захист своєї найгіршої думки",
      ],
    ],
  },
  extreme: {
    truthTopics: [
      [
        "the spicy secret you almost confessed",
        "пікантну таємницю, яку ти майже зізнався/зізналася",
      ],
      [
        "the most intense attraction you hid",
        "найсильніший потяг, який ти приховував/приховувала",
      ],
      ["a fantasy that surprised you", "фантазію, яка тебе здивувала"],
      [
        "the risky flirt you still remember",
        "ризикований флірт, який ти досі пам'ятаєш",
      ],
      [
        "the boundary you want respected every time",
        "межу, яку ти хочеш, щоб завжди поважали",
      ],
      [
        "a private message you nearly said aloud",
        "приватну фразу, яку ти майже сказав/сказала вголос",
      ],
      [
        "the most tempting person in a room",
        "найспокусливішу людину в кімнаті",
      ],
      [
        "a jealous moment you did not admit",
        "момент ревнощів, у якому ти не зізнався/зізналася",
      ],
      [
        "the boldest move you would make at this party",
        "найсміливіший крок, який ти зробив/зробила б на цій вечірці",
      ],
      [
        "the part of intimacy you find most underrated",
        "частину близькості, яку ти вважаєш найбільш недооціненою",
      ],
    ],
    dareTopics: [
      [
        "whisper a bold compliment to the nearest opposite-gender player on your left",
        "прошепочи сміливий комплімент найближчому гравцю протилежної статі зліва",
      ],
      [
        "let the nearest opposite-gender player on your right choose a flirty question for you",
        "нехай найближчий гравець протилежної статі справа обере для тебе флірт-питання",
      ],
      [
        "describe a kiss without naming the person",
        "опиши поцілунок, не називаючи людину",
      ],
      [
        "give a slow hand kiss to the nearest opposite-gender player",
        "повільно поцілуй руку найближчому гравцю протилежної статі",
      ],
      [
        "say what kind of touch is strictly off-limits for you",
        "скажи, який дотик для тебе точно заборонений",
      ],
      [
        "read the room and name the strongest chemistry",
        "оціни кімнату й назви найсильнішу хімію",
      ],
      [
        "ask the nearest opposite-gender player across from you one spicy yes-or-no question",
        "постав найближчому гравцю протилежної статі навпроти одне пікантне питання так/ні",
      ],
      [
        "act out a dramatic forbidden-romance scene",
        "зіграй драматичну сцену забороненого роману",
      ],
    ],
  },
  "18plus": {
    truthTopics: [
      [
        "your honest opinion about oral sex",
        "свою чесну думку про оральний секс",
      ],
      [
        "the body part you find most attractive",
        "частину тіла, яку ти вважаєш найпривабливішою",
      ],
      [
        "a sexual fantasy that sounds tempting to you",
        "сексуальну фантазію, яка звучить для тебе спокусливо",
      ],
      [
        "the kink or turn-on you are curious about",
        "кінк або збуджувальний момент, який тобі цікавий",
      ],
      [
        "a bedroom boundary you never compromise on",
        "межу в ліжку, з якою ти ніколи не йдеш на компроміс",
      ],
      [
        "the most awkward sex talk you have had",
        "найбільш незграбну розмову про секс, яка в тебе була",
      ],
      [
        "what makes safe sex feel easier to discuss",
        "що полегшує розмову про безпечний секс",
      ],
      [
        "your favorite non-obvious place to be touched",
        "своє улюблене неочевидне місце для дотику",
      ],
      [
        "the difference between sexy and uncomfortable for you",
        "різницю між сексуальним і некомфортним для тебе",
      ],
      [
        "what you wish partners understood about your pleasure",
        "що ти хотів/хотіла б, щоб партнери розуміли про твоє задоволення",
      ],
    ],
    dareTopics: [
      [
        "describe your favorite sexual position without demonstrating it",
        "опиши свою улюблену сексуальну позу без демонстрації",
      ],
      [
        "tell the nearest opposite-gender player on your left where you would kiss them first",
        "скажи найближчому гравцю протилежної статі зліва, куди поцілував/поцілувала б спершу",
      ],
      [
        "name one explicit turn-on and one hard boundary",
        "назви один відвертий збуджувальний момент і одну чітку межу",
      ],
      [
        "ask the nearest opposite-gender player on your right a direct bedroom question",
        "постав найближчому гравцю протилежної статі справа пряме питання про ліжко",
      ],
      [
        "describe the moment when flirting becomes clearly sexual",
        "опиши момент, коли флірт стає відверто сексуальним",
      ],
      [
        "say one thing about genitals that should never be mocked",
        "скажи одну річ про геніталії, з якої ніколи не можна насміхатися",
      ],
      [
        "describe a safe-sex item like it is a luxury product",
        "опиши засіб безпечного сексу як люксовий продукт",
      ],
      [
        "give the nearest opposite-gender player across from you a non-explicit touch they name",
        "зроби найближчому гравцю протилежної статі навпроти неінтимний дотик, який він/вона назве",
      ],
    ],
  },
};

function createAlcoholPenalty(
  categoryId: TruthOrDareCategoryId,
  type: TruthOrDarePromptType,
  _index: number
) {
  const sipCount = categoryId === "extreme" || categoryId === "18plus" ? 2 : 1;
  const typeLabel = type === "truth" ? "answer" : "dare";
  const typeLabelUk = type === "truth" ? "відповідь" : "дію";

  return {
    en: `Skip this ${typeLabel} and take ${sipCount} ${sipCount === 1 ? "sip" : "sips"}.`,
    uk: `Пропусти цю ${typeLabelUk} і зроби ${sipCount} ${sipCount === 1 ? "ковток" : "ковтки"}.`,
  };
}

function createPrompts({
  categoryId,
  topics,
  type,
}: {
  categoryId: TruthOrDareCategoryId;
  topics: readonly Labels[];
  type: TruthOrDarePromptType;
}) {
  const templates = type === "truth" ? truthTemplates : dareTemplates;

  return topics.flatMap((topic, topicIndex) =>
    templates.map((template, templateIndex): TruthOrDarePrompt => {
      const index = topicIndex * templates.length + templateIndex + 1;
      const [en, uk] = template(topic);

      return {
        id: `${categoryId}-${type}-${String(index).padStart(3, "0")}`,
        categoryId,
        type,
        text: { en, uk },
        alcoholPenalty: createAlcoholPenalty(categoryId, type, index),
      };
    })
  );
}

export const truthOrDarePrompts: readonly TruthOrDarePrompt[] =
  truthOrDareCategoryIds.flatMap((categoryId) => {
    const seed = contentSeeds[categoryId];

    return [
      ...createPrompts({
        categoryId,
        topics: seed.truthTopics,
        type: "truth",
      }),
      ...createPrompts({
        categoryId,
        topics: seed.dareTopics,
        type: "dare",
      }),
    ];
  });

const promptsById = new Map(
  truthOrDarePrompts.map((prompt) => [prompt.id, prompt])
);

export function getTruthOrDarePromptById(promptId: string) {
  return promptsById.get(promptId);
}

export function getTruthOrDarePromptsForCategories(
  categoryIds: readonly TruthOrDareCategoryId[],
  type?: TruthOrDarePromptType
) {
  const selectedCategoryIds = new Set(categoryIds);

  return truthOrDarePrompts.filter(
    (prompt) =>
      selectedCategoryIds.has(prompt.categoryId) &&
      (type ? prompt.type === type : true)
  );
}

export function getTruthOrDarePromptCounts(categoryId: TruthOrDareCategoryId) {
  const prompts = getTruthOrDarePromptsForCategories([categoryId]);

  return {
    dares: prompts.filter((prompt) => prompt.type === "dare").length,
    truths: prompts.filter((prompt) => prompt.type === "truth").length,
    total: prompts.length,
  };
}

export function getTruthOrDareAdultCategoryIds() {
  return truthOrDareCategories
    .filter((category) => category.isAdultOnly)
    .map((category) => category.id);
}
