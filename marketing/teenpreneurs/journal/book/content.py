# -*- coding: utf-8 -*-
"""All the words of The Teenpreneur Journal, v6.

Source: Milena Rudd's original DOCX. Wording is hers. Changes are punctuation only (em dashes became commas or full stops)
unless the entry is tagged in CHANGES at the bottom. Block types:
  ("p", text)  paragraph        ("h", text)   subhead         ("q", text)  callout
  ("ul", [..]) bullets          ("ol", [..])  numbered list   ("img", key) illustration
"""

FOREWORD = [
    ("p", "If you’re expecting a book full of business buzzwords and textbook definitions, this isn’t it. And if I’m honest, that’s exactly the kind of book I would’ve ignored as a teenager."),
    ("p", "Even though I have a master’s degree in economics, I didn’t write this journal to teach you about balance sheets or inflation. Why? Because I learned the most important things about life, entrepreneurship, and myself after university, not during it."),
    ("q", "I created this book because I wish I had something like this when I was a teenager."),
    ("p", "Back then, I didn’t fit the mould (I have ADHD, dyslexia, and the kind of brain that never quite sits still). I didn’t read books for fun, only when I absolutely had to pass an exam. And even then, I’d push it to the very last minute. Books didn’t speak to me… until I found the ones that finally did."),
    ("p", "It wasn’t the official professors who changed my life. It was the unofficial ones: Steven Bartlett, Brené Brown, Stephen Covey, Napoleon Hill, Mel Robbins, Tony Robbins, Dean Graziosi, James Clear, and many more. They were the authors who handed me the mindset shifts, habits, and courage I needed to actually start building my life, not just pass tests."),
    ("p", "I fell in love with books (audiobooks, to be precise) because suddenly learning felt like freedom, not a chore. It felt like answers to the questions I’d been carrying for years."),
    ("p", "That’s why this journal exists. Not just to help you “start a business,” but to help you start something even bigger: your mindset, your confidence, your awareness, your voice."),
    ("p", "This is for the dreamers and doers. The misunderstood and underestimated. The ones who might not feel “academic” but are absolutely brilliant in their own way."),
    ("pq", "Here’s to the crazy ones. The misfits. The rebels. The troublemakers. The round pegs in the square holes. The ones who see things differently. … They push the human race forward. And while some may see them as the crazy ones, we see genius. Because the people who are crazy enough to think they can change the world are the ones who do.", "Apple, Think Different, 1997"),
    ("p", "This is the journal I wish I had when I was 13. Or 17. Or even 25."),
    ("p", "Whether or not you ever become an entrepreneur in the traditional sense, my hope is that The Teenpreneur Journal helps you realise you’re already the CEO of your own life. And that’s where the real journey begins."),
    ("sig", "Milena Rudd", "Home educator of two teenagers  •  Founder of uNickorns and uNick Academy  •  Lover of dogs and underdogs  •  And former teen who felt… just like you."),
]

INTRO = [
    ("p", "Hey,"),
    ("p", "If you’re reading this, I already know one thing about you: you’re not like everyone else. Not in a cheesy “you’re so unique” kind of way, but in a real, quiet way."),
    ("p", "Maybe you’re curious. Maybe you question things more than your teachers or parents would like. Maybe you feel like something’s off with the way the world is set up (school, life, expectations, rules) but you can’t quite put your finger on what or why."),
    ("q", "Or maybe you just want more. More meaning. More space. More truth."),
    ("p", "This journal isn’t going to give you all the answers. But it might help you ask better questions. It might help you think bigger, go deeper, and notice how much power you already have, even if nobody’s ever told you that before."),
    ("p", "It’s not about becoming a millionaire by 18. It’s not about getting perfect grades, or building a business, or impressing your parents. It’s about figuring out who you are, what actually matters to you, and how to live life in a way that feels honest, exciting, and yours."),
    ("p", "You won’t find long to-do lists here. You will find questions. Challenges. Stories. Space to write, rant, plan, dream. And sometimes pages with nothing on them. On purpose. Because sometimes you just need space."),
    ("q", "This isn’t a shortcut. It’s not a manual. It’s a mirror."),
    ("p", "And if you use it, it will grow with you. Through wins, doubts, heartbreaks, ideas, boredom, and big, messy questions like:"),
    ("ul", ["What am I even doing with my life?", "What if I don’t fit in?", "What if I don’t want to?"]),
    ("h", "So here’s the only rule: use this however you want."),
    ("p", "You don’t have to go in order. You don’t have to finish it in a week or a year. You don’t have to impress anyone, including yourself. Just show up."),
    ("p", "Write when it feels good. Think when something hits different. Ignore parts that feel off. You don’t have to answer every question. Start with the one that pulls you. And keep going."),
    ("p", "Welcome to your real diary. The one you might just carry with you through your teens, and maybe a little longer."),
    ("p", "Let’s begin."),
]

PARTS = [
    dict(id=1, label="PART 1", title="Wake up", sub="The world is bigger than school.", tone="coral", chapters=[
        dict(n=1, title="The Conveyor Belt Trap", sub="Why the system wasn’t built for you.", blocks=[
            ("p", "Let’s be honest: school feels like a conveyor belt."),
            ("p", "Everyone’s moving in the same direction, at the same speed, being told what to do, what to memorise, and when they’re allowed to ask questions."),
            ("img", "belt"),
            ("p", "It works for some people. Maybe even most."),
            ("p", "But if you’ve ever felt like you’re meant for something different, something more, then you’ve probably already noticed that the system wasn’t really built for you."),
            ("p", "Here’s the truth: much of the traditional system took shape in the industrial era, when the world needed people who could follow instructions in factories and offices. It was not designed for freedom, creativity, or entrepreneurship."),
            ("h", "That’s why you’ve probably never been taught how to:"),
            ("ul", ["Deal with self-doubt", "Create your own income", "Understand how your mind actually works", "Set real goals that mean something"]),
            ("p", "Instead, you’re taught how to pass tests, follow instructions, and sit still for hours."),
            ("p", "School also gives you real things: friends, teachers who care, and knowledge worth having. This journal is not against school. It adds what school rarely has time for."),
            ("q", "Following the same path as everyone else doesn’t guarantee you’ll end up happy, or even successful."),
            ("p", "If you’ve ever looked around and thought, “Is this it?”, you’re not alone. That question isn’t something to fear. It’s something to explore."),
            ("p", "This chapter is about waking up to the fact that you don’t have to walk the beaten path. You can design your own. You can learn in your own way, think differently, and build a life that feels like yours, even if it looks nothing like the one they expected you to live."),
            ("p", "But first, you need to start asking better questions."),
        ], prompts=[
            "What do you think school is trying to prepare you for?",
            "Do you believe the traditional path is right for you? Why or why not?",
            "If there were no rules or expectations, what would you want to learn more about right now?",
        ]),
        dict(n=2, title="You Are Not Lazy", sub="You’re just unchallenged.", blocks=[
            ("p", "Let’s clear something up: you’re not lazy."),
            ("p", "You’re not broken. You’re not “just not motivated”. You’re probably just not being challenged in the right way."),
            ("p", "The truth is, many schools reward routine, repetition, and memorisation more than curiosity, deep thinking or independent ideas."),
            ("q", "So when your brain gets bored or switches off, it’s not a flaw. It’s feedback. Feedback that says: “I need something more. Something real. Something that actually matters to me.”"),
            ("p", "If you’ve ever felt like you can focus for hours on the things that interest you, but shut down when you’re forced to do something pointless, that’s not a lack of discipline. It’s proof that you’re alive."),
            ("q", "Real motivation doesn’t come from being pushed. It comes from being pulled, by things that spark your curiosity, your passion, your sense of purpose."),
            ("p", "That’s why this journal isn’t about making you “work harder”. It’s about helping you reconnect with what naturally drives you, and giving you permission to follow it."),
            ("p", "Because once you start noticing what lights you up, you can stop trying to “fit in” and start following what actually fits you. And that’s when things really start to shift."),
        ], prompts=[
            "What subjects or topics do you genuinely enjoy, even if you’re not taught them at school?",
            "When do you feel most focused or energised?",
            "What’s one thing you’ve always been curious about but never explored?",
        ]),
    ]),
    dict(id=2, label="PART 2", title="Think differently", sub="And bigger. Much bigger.", tone="lavender", chapters=[
        dict(n=3, title="Habits That Shape Your Future", sub="Small actions. Massive results.", blocks=[
            ("p", "Let’s talk habits, but not in the boring way."),
            ("p", "This isn’t about waking up at 5am, drinking green smoothies, or making colour-coded revision charts. It’s about becoming the kind of person who does the things that matter, without needing to force it every time."),
            ("p", "Because here’s the truth: your future isn’t built by big, dramatic changes. It’s shaped by small actions you repeat every day. The way you speak to yourself. The way you respond to stress. The way you handle distractions, get started, or follow through."),
            ("p", "And the most powerful part? You can rewire all of it. You don’t need to “fix” yourself. You just need to practise being the version of yourself you want to become, one small habit at a time."),
            ("p", "It starts by asking a different question. Not “What do I want to achieve?” but “Who do I want to become?”"),
            ("p", "Because your habits follow your identity. If you see yourself as someone creative, consistent, or curious, you’ll naturally start doing things that match that belief. And if you don’t see yourself that way yet, you can start by proving it to yourself with small wins."),
            ("q", "Even one tiny habit, done daily, can change how you see yourself. And when your identity shifts, your life does too."),
            ("p", "So instead of waiting for motivation or the perfect time, just start small. Pick something that matters. Make it easy. And do it again tomorrow."),
        ], prompts_intro="Be honest. No one else needs to read it.", prompts=[
            "What kind of person do you want to become in the next year?",
            "What habits would that version of you already have?",
            "What is one habit you could start building this week, something so small it’s almost too easy to fail?",
            "When in the day could you realistically do it?",
            "What’s something that might get in the way? How can you plan for it?",
        ]),
        dict(n=4, title="Your Mind Is a Tool", sub="Not a dictator.", blocks=[
            ("p", "Have you ever felt like your thoughts take over, out of nowhere?"),
            ("p", "One moment you’re calm, the next you’re spiralling into stress, doubt or self-criticism. That’s not you being dramatic. That’s just how the teenage brain works, and you’re not alone."),
            ("q", "Your mind is a tool. Not a dictator."),
            ("p", "This chapter will show you how to recognise that tool, understand it, and start using it on your terms."),
            ("h", "Your Teenage Brain"),
            ("p", "Right now, your brain is developing fast. The emotional part (the amygdala) matures earlier than the logical part (the prefrontal cortex). That means your feelings often react before your thinking can catch up."),
            ("p", "Good news? Your brain is incredibly adaptable. Every time you practise something, like calming down or learning a new skill, your brain strengthens that connection. This is called neuroplasticity. It means your brain is always growing, and you can shape how it works."),
            ("h", "Fixed vs Growth Mindset"),
            ("p", "A fixed mindset says: “I’m just not good at this.” A growth mindset says: “I’m not good at this YET.”"),
            ("p", "That one little word makes a huge difference. Believing you can improve, and acting on it, is how people grow in any area of life."),
            ("h", "How to Manage Emotions"),
            ("ol", ["Pause and breathe. Deep breathing helps calm your body and clear your head.", "Name the feeling. Saying “I feel nervous” helps your brain sort what’s happening.", "Don’t judge it. Feeling sad or angry isn’t wrong, it’s information.", "Express it. Write, talk, move, draw. Let it out in a way that doesn’t hurt you or others."]),
            ("h", "Dealing with Negative Self-Talk"),
            ("p", "Everyone has an inner voice. Sometimes it’s helpful. Sometimes it’s cruel. That negative voice is not the truth. It’s just loud. Try these steps:"),
            ("ul", ["Catch it: notice when you’re thinking something harsh.", "Question it: is this thought 100% true?", "Reframe it: “I failed” becomes “I learned something I can use next time.”", "Talk to yourself like you’d talk to a good friend."]),
            ("h", "Thoughts Are Not Facts"),
            ("q", "Just because you think something doesn’t make it true."),
            ("p", "You are not your thoughts. You are the one observing them. That means you can question them, redirect them, or even ignore them. Think of your thoughts like clouds. They pass through. You don’t have to hold onto every single one."),
        ], prompts=[
            "What’s one thing you’ve learned about your brain that surprised you?",
            "Think of a recent negative thought. How would you respond to it with kindness?",
            "What helps you feel calmer when emotions get strong?",
            "Write a sentence or draw something that reminds you: you’re the boss of your thoughts.",
        ]),
    ]),
    dict(id=3, label="PART 3", title="Unlock who you are", sub="And who you could be.", tone="blue", chapters=[
        dict(n=5, title="Know Yourself or Copy Everyone Else", sub="Your values. Your compass. Your call.", blocks=[
            ("p", "You’re constantly told who to be. Good student. Polite child. Reliable friend. Future success story. But who are you, really?"),
            ("p", "If you don’t stop to ask that question, the world will answer it for you, and you might spend years chasing a life that isn’t even yours."),
            ("p", "This chapter is all about getting honest with yourself. What do you care about? What kind of person do you want to be? And how do you build a life around that, instead of just trying to “fit in”?"),
            ("h", "Who Are You, Really?"),
            ("p", "Most people copy others without realising it. That’s normal. We’re wired to mirror the world around us. But following the crowd doesn’t always lead somewhere meaningful. If everyone is chasing the same grades, the same jobs, the same goals, but nobody’s asking why, it’s easy to lose yourself."),
            ("q", "The question isn’t, “What should I do?” It’s, “What actually matters to me?”"),
            ("h", "Your Core Values"),
            ("p", "Your values are the things that matter most to you, not to your parents, teachers, friends or social media, but to you. When your actions align with your values, you feel grounded. When they don’t, you feel off."),
            ("p", "Common values might include honesty, freedom, creativity, connection, kindness, learning, or challenge. There’s no right or wrong list, just what feels true to you."),
            ("h", "How to Find Your Values"),
            ("p", "Think about moments when you felt proud, energised, or inspired. What were you doing? Who were you with? Why did it feel good? Now think about times you felt uncomfortable or frustrated. Was something important to you being ignored? Patterns will start to appear. That’s your real compass."),
            ("h", "Create Your Own Definition of Success"),
            ("p", "The world will try to define success for you: fame, money, followers, diplomas. But real success feels different for everyone. For one person, it might be creating beautiful things. For another, helping others. For someone else, exploring the world."),
            ("q", "Don’t copy someone else’s dream. Build your own."),
        ], prompts=[
            "What do you value most in life? (List 5 things that matter deeply to you.)",
            "Think of a time you felt really proud of yourself. What does that moment say about your values?",
            "Describe the kind of person you want to become, not the job or achievements, but your character.",
            "What does success look like to you (not what others expect)?",
            "What small step could you take to live more in line with your values?",
        ]),
        dict(n=6, title="The People Around You", sub="Your circle = your future.", blocks=[
            ("p", "Look around you. The people you spend time with shape your life more than you think. They influence how you think, how you talk, what you believe is possible, and even who you become."),
            ("p", "So if you want to grow into the best version of yourself, you need to pay attention to your circle."),
            ("h", "The Power of Influence"),
            ("p", "Humans are wired to fit in. We mirror the people around us to feel safe and accepted. That’s why your social circle is so powerful."),
            ("p", "Hang around people who complain all the time, and you’ll start to see life as negative. Spend time with people who are curious, motivated and supportive, and you’ll feel more of those things too."),
            ("h", "Audit Your Circle"),
            ("p", "Ask yourself: Who builds me up? Who brings me down? This doesn’t mean cutting people off harshly, but it does mean choosing where to invest your energy. It’s okay to outgrow relationships that no longer align with who you’re becoming."),
            ("h", "How to Find Your People"),
            ("p", "You don’t need a big group. You just need a few real ones. Look for people who:"),
            ("ul", ["Get excited about learning or creating things.", "Support you without jealousy or competition.", "Make you feel safe to be yourself.", "Encourage growth, not gossip."]),
            ("p", "Can’t find them nearby? Look online. Communities, courses, interest groups: your people exist, and they’re waiting too. Stay smart while you do: keep personal details private, and tell a trusted adult where you spend your time."),
            ("h", "Create a Growth Bubble"),
            ("p", "If your current environment doesn’t support your goals, build your own. Fill your world with things and people that challenge and inspire you. Podcasts. Books. Mentors. Music. Coaches. Friends who want more from life."),
            ("q", "Your surroundings can pull you down or lift you up. Choose carefully."),
        ], prompts=[
            "Who are the five people you spend the most time with? How do they make you feel?",
            "Which relationships give you energy? Which ones drain it?",
            "Who inspires you? Why?",
            "What kind of people do you want more of in your life?",
            "What’s one step you could take to connect with people who lift you up?",
        ]),
    ]),
    dict(id=4, label="PART 4", title="Do something real", sub="Ideas are great. Action is everything.", tone="seafoam", chapters=[
        dict(n=7, title="Money, Freedom & Purpose", sub="Let’s talk business.", blocks=[
            ("p", "Money isn’t just paper or numbers on a screen. It’s a tool for freedom, for choices, for change."),
            ("p", "This chapter isn’t about becoming obsessed with money. It’s about understanding it, respecting it, and learning how to use it to create a life that feels free and fulfilling. Money can be part of your purpose. Let’s explore how."),
            ("h", "What Money Really Is"),
            ("p", "Money is a way of exchanging value. That’s it. When you solve a problem, make a useful product, entertain someone, or help them in some way, and they’re willing to pay for it, that’s value. You don’t have to wait until you’re older to start thinking like someone who creates value."),
            ("h", "Freedom Through Money"),
            ("p", "Money doesn’t make you happy. But it can give you options. It can help you travel, support people you love, say “no” to jobs you hate, or build something meaningful. It’s not about greed. It’s about choosing the kind of life you want, and having the means to live it."),
            ("h", "Purpose-Driven Business"),
            ("p", "Some people think business is only about profit. But the best businesses solve real problems and make people’s lives better. You don’t have to be a “business person” to think like a problem-solver. Entrepreneurship is just about noticing problems and coming up with ideas to fix them, then testing, adjusting, and growing."),
            ("h", "Business Ideas for Teens"),
            ("p", "Here are some ways teens are already making money while learning big skills:"),
            ("ul", ["Tutoring younger kids in subjects you’re good at", "Making digital art, graphics or videos", "Creating content around a passion (YouTube, TikTok, blogging)", "Fixing or selling second-hand tech or clothes", "Designing handmade jewellery or crafts"]),
            ("q", "The key is to start small, learn as you go, and focus on helping others."),
            ("p", "One practical thing: talk with a parent or carer before you sell anything or open an account in your name. The rules depend on your age and where you live."),
        ], idea_box=True, prompts=[
            "What’s something you’re good at, or interested in, that could help others?",
            "What does “freedom” mean to you, and how could money help support that?",
            "Think of a small problem you could solve for someone. Could you turn it into a tiny business?",
            "What skills would you love to learn that might help you in the future?",
            "What would you want your future business or job to stand for? (Kindness? Innovation? Creativity?)",
        ]),
        dict(n=8, title="Test, Fail, Repeat", sub="The real formula for success.", blocks=[
            ("p", "Everyone wants to win. But the truth is, no one wins without first failing, a lot."),
            ("q", "Behind every cool success story is someone who tested, messed up, learned, and kept going."),
            ("p", "This chapter is about getting comfortable with the messy middle."),
            ("h", "Why Failing Is Part of Winning"),
            ("p", "Failure isn’t the opposite of success. It’s part of it. Think of it like feedback. Every time something doesn’t work out, you learn something: what to do better, what not to do next time, what to try instead. Without trying and failing, you don’t grow. You just stay stuck."),
            ("h", "Real Life Examples"),
            ("ul", ["J.K. Rowling was turned down by 12 publishers before Harry Potter was accepted.", "Michael Jordan did not make the varsity basketball team in his second year of high school. He kept practising.", "Elon Musk’s early SpaceX rockets exploded. Steve Jobs was pushed out of Apple, the company he started.", "Decca Records turned down The Beatles in 1962, reportedly because guitar groups were “on the way out”."]),
            ("p", "They didn’t quit. They tested, failed, repeated, and kept moving."),
            ("h", "The Myth of Perfection"),
            ("p", "Perfection is a trap. It makes you wait, overthink, and fear mistakes. Trying to be perfect will stop you from ever starting. But starting messy? That’s where the real progress happens."),
            ("q", "You don’t need to get it right. You just need to get going."),
            ("h", "Testing Your Ideas"),
            ("p", "Got a business idea? A passion project? A goal? Don’t wait until it’s perfect. Start small. Try it out. Get feedback. Adjust. Try again. That’s how real creators, entrepreneurs and artists do it. They test fast and learn faster."),
        ], prompts=[
            "What’s something you tried that didn’t go how you hoped, but taught you something?",
            "What’s one project or idea you’ve been putting off because you’re scared it won’t be perfect?",
            "What small step could you take this week to test it out, without overthinking?",
            "Write a new definition of failure. (For example: “Failure = not trying.”)",
        ]),
        dict(n=9, title="Build a System, Not Just Motivation", sub="Motivation fades. Systems last.", blocks=[
            ("p", "Motivation feels amazing… until it disappears. One day you’re ready to change the world. The next, you can’t even change your bedsheets."),
            ("p", "This chapter is about building systems that keep you moving forward, even when motivation doesn’t show up."),
            ("h", "Why Motivation Fades"),
            ("p", "Motivation is like weather: it comes and goes. It’s based on emotions, energy levels, and even the time of day. Relying on it alone is risky. That’s why successful people build habits and systems to support their goals."),
            ("h", "What Is a System?"),
            ("p", "A system is a routine or structure that helps you take action without needing to feel inspired. It’s a plan you follow even when you’re tired, bored or unsure. Like brushing your teeth, it becomes automatic over time."),
            ("h", "Examples of Systems"),
            ("ul", ["A morning routine that sets you up for focus.", "A checklist for getting homework done.", "A weekly “check-in” where you plan and reflect.", "An accountability buddy who helps you stay on track."]),
            ("h", "Building Your Own System"),
            ("p", "Start small. Choose one area of life you want to improve. Then think:"),
            ("ul", ["What tiny action could I repeat every day?", "When will I do it?", "What will remind me?"]),
            ("p", "Track it. Celebrate it. Adjust it as needed. Systems should support you, not stress you out."),
            ("q", "If a system keeps falling apart, the system is the problem, not you. Make it smaller, make it visible, make it fun."),
        ], prompts=[
            "What’s one area of your life that feels chaotic or stuck?",
            "What’s one small habit you could create to improve it?",
            "When could you realistically do it each day or week?",
            "Who or what could help keep you accountable?",
            "How would your life change if you had better systems in place?",
        ]),
        dict(n=10, title="What You Feed Your Mind, You Become", sub="Inputs shape outputs.", blocks=[
            ("p", "Your brain is always listening. Watching. Absorbing. Everything you take in, the people you follow, the shows you binge, the music you play on repeat, shapes how you think, feel and act."),
            ("p", "This chapter is about becoming the DJ of your own mind. If what you’re consuming isn’t helping you grow, you can change the track."),
            ("h", "Input = Output"),
            ("p", "If you constantly scroll through negative, shallow or toxic content, don’t be surprised if you feel drained or doubtful. On the flip side, consuming uplifting, creative, or challenging content can boost your confidence, ideas, and energy."),
            ("q", "What you feed your mind is what your life will start to reflect."),
            ("h", "Who Are You Following?"),
            ("p", "Take a look at your social media. Who’s in your feed? Do they make you feel inspired, or not good enough? It’s okay to unfollow people who don’t add real value. Create a feed that reflects who you want to become."),
            ("h", "Digital Detox (Even a Mini One)"),
            ("p", "You don’t have to quit the internet. But even a short break can reset your brain. Try one day without scrolling. Or one hour before bed without screens. Use the time to walk, reflect, write, read, create. Watch how differently your mind feels."),
            ("h", "Curate Your Input"),
            ("p", "Fill your world with content that lifts you:"),
            ("ul", ["Podcasts that make you think", "Books that open your perspective", "Music that makes you feel strong", "Voices that speak kindness, honesty, creativity"]),
            ("p", "You are the gatekeeper of your mental space. Choose wisely."),
        ], prompts=[
            "What are three things you consume daily (online or offline)?",
            "How do they make you feel afterwards, energised or drained?",
            "Who’s one person online who genuinely inspires you? Why?",
            "What kind of content do you want more of in your life?",
            "What small habit could help you feed your mind better this week?",
        ]),
        dict(n=11, title="Energy Is Everything", sub="And it’s not just about sleep.", blocks=[
            ("p", "Energy fuels everything: your thoughts, your focus, your mood, your motivation."),
            ("p", "But it’s not just about getting enough sleep. It’s about knowing what drains you, what recharges you, and how to protect your energy like it matters, because it does."),
            ("h", "Beyond Sleep"),
            ("p", "Yes, sleep is important. So is hydration, food, and movement. But energy isn’t just physical. It’s also emotional, mental, and social. Sometimes you’re tired not because you need rest, but because something (or someone) is draining your vibe."),
            ("h", "Energy Boosters"),
            ("p", "Here are things that genuinely give most people more energy:"),
            ("ul", ["Being outside", "Laughing with people you like", "Moving your body (even just dancing or stretching)", "Doing something creative or hands-on", "Listening to music that shifts your mood", "Helping someone else"]),
            ("p", "Your list might look different. What matters is noticing what makes you feel alive."),
            ("h", "Energy Thieves"),
            ("p", "These are different for everyone, but some common ones include:"),
            ("ul", ["Too much screen time (especially doom-scrolling)", "Hanging out with people who complain or gossip", "Doing things out of guilt, not purpose", "Worrying about things you can’t control", "Saying “yes” to everything and leaving no space for you"]),
            ("p", "You don’t have to remove everything. Just notice where your energy leaks are."),
            ("h", "Protect Your Energy"),
            ("p", "You don’t need to earn your rest. You’re allowed to recharge, no guilt. Set boundaries. Take breaks. Say no. Walk away from drama. Prioritise joy."),
            ("q", "This isn’t selfish. It’s smart. Because when your energy is right, everything else flows better."),
        ], prompts=[
            "What activities boost your energy, physically, mentally, emotionally?",
            "What things or people tend to drain you?",
            "When was the last time you felt fully energised? What were you doing?",
            "What’s one boundary you could set to protect your energy?",
            "How could you build more energy-boosting habits into your week?",
        ]),
        dict(n=12, title="Your Future Is Not on a Checklist", sub="It’s a story you get to write.", blocks=[
            ("p", "You’ve probably been told your whole life to follow the steps: Do well in school. Get good grades. Pick a career. Go to uni. Get a job. Buy a house. Retire."),
            ("q", "But what if your path doesn’t look like that?"),
            ("p", "This chapter is about remembering that your future isn’t a checklist. It’s a story you get to write."),
            ("h", "The Myth of the “One Path”"),
            ("p", "There is no single correct way to build a life. Some people thrive in university. Others build businesses, make music, travel, raise families, or invent things we haven’t even imagined yet."),
            ("p", "The world is changing fast. Careers that don’t exist now might be common in 10 years. That means flexibility and self-awareness matter more than any fixed plan."),
            ("h", "You Get to Decide"),
            ("p", "Your path should fit you, not the other way around. It doesn’t have to make sense to everyone else. You don’t need permission to take an unconventional route. Ask yourself: What do I want to explore? Who do I want to become? How do I want to grow? These questions are more powerful than any test score or title."),
            ("h", "Redefining Success"),
            ("p", "Success isn’t one-size-fits-all. For some, it’s about impact. For others, creativity. For others, peace. Define your own version. Check in with it often. You’re allowed to change it as you grow."),
            ("h", "Build a Life, Not Just a CV"),
            ("p", "It’s easy to get caught in the race to achieve. But a fulfilled life isn’t just made of accomplishments. It’s made of curiosity, relationships, growth, joy, failure and meaning."),
            ("q", "Don’t forget to live the life you’re building."),
        ], prompts=[
            "What’s something you were told you “should” do, but doesn’t feel right to you?",
            "What parts of life do you care about most? Not what others expect, but what actually excites or fulfils you.",
            "Imagine your ideal day, 10 years from now. Where are you? What are you doing? Who are you with?",
            "What would your future look like if you weren’t afraid to disappoint anyone?",
            "What’s one brave, small step you could take to create a future that feels like yours?",
        ]),
        dict(n=13, title="Your Voice Matters", sub="Even if you’re still figuring it out.", blocks=[
            ("p", "You don’t have to wait until you’re older, smarter, or more experienced to speak up. Your thoughts, your ideas, your feelings, they matter now."),
            ("p", "This chapter is about discovering your voice, trusting it, and learning how to use it (even if it shakes at first)."),
            ("h", "What Is Your Voice?"),
            ("p", "Your voice is more than the sound you make. It’s your perspective. Your story. Your creativity. Your questions. It shows up in how you speak, write, create, act, or even just show up."),
            ("q", "You don’t need to be loud or perfect. Just real."),
            ("h", "Why Some People Stay Silent"),
            ("p", "Maybe you’ve been told you talk too much. Or not enough. Maybe you’re afraid to say the wrong thing. Or that no one will care."),
            ("p", "But here’s the truth: staying silent to fit in means shrinking the very thing that makes you powerful, your individuality."),
            ("h", "How to Start Using Your Voice"),
            ("ul", ["Share your opinion, even when it’s different.", "Ask questions others are afraid to ask.", "Create something: write, draw, record, build.", "Speak up when something feels unfair."]),
            ("p", "Every time you express your truth, your voice grows stronger."),
            ("h", "You Don’t Have to Have It All Figured Out"),
            ("p", "You’re allowed to change your mind. You can speak with uncertainty, curiosity, and openness. Your voice doesn’t have to come with a script. Just let it come from a place of honesty and care."),
        ], prompts=[
            "When was a time you stayed quiet, but wish you’d spoken up?",
            "What message or idea do you wish more people talked about?",
            "How do you express yourself best: writing, speaking, creating, something else?",
            "What’s something you’d like to say more often, even if it’s scary?",
            "Write one sentence that feels true to you right now. Say it out loud. Let it be your voice.",
        ]),
        dict(n=14, title="You Don’t Have to Do It Alone", sub="Real strength knows when to ask for help.", blocks=[
            ("p", "There’s this myth that strong people do everything on their own. But real strength? It’s knowing when to ask for help. It’s reaching out, not shutting down."),
            ("p", "This chapter is about connection, support, and the courage to let others in."),
            ("h", "We All Need People"),
            ("p", "Even the most independent people rely on others. Coaches. Mentors. Friends. Family. Therapists. Nobody thrives in total isolation. We’re wired for connection, to share burdens, ideas, dreams, and laughter. It’s okay to need people. It’s human."),
            ("h", "Asking for Help Is Brave"),
            ("p", "Sometimes asking for help feels like weakness. Like you’ve failed."),
            ("q", "Asking for help means you’re smart enough to know your limits, and brave enough to do something about it."),
            ("p", "Whether it’s emotional support, guidance, or just someone to listen, reaching out is powerful."),
            ("h", "Who’s in Your Corner?"),
            ("p", "Think about the people you can turn to, even if it’s just one or two. They might not always have the perfect words, but their presence matters. You don’t need a crowd. You need people who care, and who let you be yourself."),
            ("h", "Be That Person Too"),
            ("p", "Support goes both ways. Listen when others share. Encourage their goals. Sit with them in their hard moments. You never know how much your kindness might mean to someone else."),
            ("p", "If things ever feel too heavy, turn to the page “If things feel too heavy” on page {{ref:wellbeing}}."),
        ], prompts=[
            "Who are three people you trust to talk to when things get hard?",
            "What stops you from asking for help when you need it?",
            "When was a time someone supported you, and it made a difference?",
            "What does real support feel like to you?",
            "How could you be a better support for someone else this week?",
        ]),
        dict(n=15, title="Write Your Own Story", sub="You are the author.", blocks=[
            ("p", "If your life was a book, who’s writing it? For a long time, other people might have held the pen. Teachers. Parents. Social media. Expectations."),
            ("q", "But now, it’s time to take it back."),
            ("h", "You Are the Author"),
            ("p", "Your story is still being written. And no, you don’t need to know the final chapter. What matters is the next sentence. The next page. The next choice. You get to decide what kind of person you want to be, and how you want to grow."),
            ("h", "Rewrite the Narrative"),
            ("p", "Many of us carry old stories in our heads: “I’m not smart enough.” “I always mess things up.” “No one listens to me.” But stories can be rewritten. Change the script: “I’m learning.” “I’m getting stronger.” “I’m allowed to grow.”"),
            ("h", "The Power of Journaling"),
            ("p", "Journaling is more than venting. It’s a way to reflect, track your growth, and make sense of your life. It’s a quiet place to think things through. Use this journal to be honest with yourself, not perfect, just real."),
            ("h", "Future-Self Letter"),
            ("p", "One powerful tool? Writing a letter from your future self, the version of you who has grown through the hard stuff and kept going. Imagine you at 25. What advice would they give you? What would they thank you for?"),
            ("q", "This letter is a reminder that you’re not stuck. You’re becoming."),
        ], prompts=[
            "What’s a belief or story about yourself that you’re ready to change?",
            "What are you proud of yourself for surviving or learning this year?",
            "If your life was a book, what would this chapter be called?",
            "Write a letter from your 25-year-old self to you right now. What would they say? (Use the next pages.)",
            "What’s the story you want to live, even if it’s different from everyone else’s?",
        ]),
    ]),
]

BONUS_AI = dict(n="+", title="Think Alongside AI", sub="Use it to think better, not to think less.", blocks=[
    ("p", "AI tools can answer almost anything in seconds. That is exciting, and a little scary. The question for you isn’t whether to use AI. It’s how to use it so you get sharper, not lazier."),
    ("q", "AI can be your sparring partner. It should never be your replacement."),
    ("h", "Three things AI can’t do for you"),
    ("ul", ["Care about the problem. It doesn’t know what you notice, what bothers you, or what you want to change.", "Choose. It can list ten options. You decide which one fits your values.", "Be you. Your voice, your story and your questions are the whole point."]),
    ("h", "Five good ways to use it"),
    ("ul", ["Ask it to question your idea, not just praise it.", "Ask it to explain something confusing, in simple words.", "Ask for feedback on a draft you wrote yourself.", "Brainstorm 20 bad ideas, then pick the least bad one and improve it.", "Role play a customer, a teacher or a sceptical friend, so you can practise."]),
    ("h", "Four rules to keep"),
    ("ol", ["Think first. Write your own first attempt, then bring in the AI.", "Check the facts. AI can sound completely sure and be completely wrong.", "Protect your privacy. Never share your full name, address, school, or photos of other people.", "Be honest. Say when AI helped you. And check the age rules for any tool, and talk with a parent or carer about how you use it."]),
    ("h", "The “explain it” test"),
    ("q", "Close the chat. Can you explain your idea to a friend in your own words? If not, you haven’t learned it yet."),
], prompts=[
    "What’s one thing you do now where AI could help, and which part of it must stay yours?",
    "Ask an AI to challenge one of your ideas. What did it get right? What did it miss or get wrong?",
    "When do you copy instead of create? What would it look like to make the first move yourself?",
    "Write your own three rules for using AI. Keep them short enough to remember.",
    "Which skills do you want to build so well that you never want to hand them over?",
])

# ---------------------------------------------------------------- When the Doubt Comes
DOUBT_INTRO = [
    ("pq", "Fear kills more dreams than failure ever will.", "Suzy Kassem"),
    ("h", "The Voice in Your Head (You’re Not Alone)"),
    ("p", "So doubt showed up again, huh? That annoying little voice is whispering, “You’re not good enough. You’re a fraud. Why even try?” First off, breathe. There’s nothing wrong with you. Nearly everyone hears a nagging voice like that sometimes, even your super confident friend, even your favourite celebrity."),
    ("p", "It even has a name: imposter syndrome, the feeling that you’re not as capable as other people think. Estimates of how common it is vary a lot, but it is very common. Michelle Obama has said she still feels it. Self-doubt is part of being human, and you’re in good company. The difference-maker is what you do when doubt sneaks in."),
    ("q", "Successful people aren’t successful because they never have self-doubt. They’re successful because they move forward despite it."),
    ("h", "Why Doubt Can Be a Good Sign"),
    ("p", "Here’s a plot twist: that knot in your stomach and the voice shouting “Who do you think you are?” might actually be good news. You usually feel imposter syndrome exactly when you’re stretching beyond your comfort zone, trying something new, bold, or important to you. You don’t get it from sitting on the couch doing nothing. You get it when you’re reaching higher."),
    ("p", "Doubt often means you actually care about what you’re doing. Next time you feel those jitters, try telling yourself: “This feeling means I’m growing. My brain is just catching up with my new reality.”"),
    ("q", "If you’re feeling a bit of fear, maybe, just maybe, there’s a gift waiting for you on the other side of it."),
    ("h", "Meet Your Inner Villain (and Your Inner Hero)"),
    ("p", "Let’s talk about that voice inside, the harsh one that loves to point out your flaws. Call it the inner critic, or the inner villain. You don’t have to accept everything it says as truth. It’s only one part of your mind. You also have an inner hero, a kinder, braver voice that celebrates your strengths and dreams. When we’re stressed or scared, the villain tends to shout louder. Our job is to turn up the volume on the hero instead."),
]
DOUBT_EXERCISE = dict(
    title="Journal exercise",
    text="Give your inner critic a fun (or better, ridiculous) name. “Doubting Dora.” “Negative Nigel.” Something that makes you smirk. Now give your encouraging voice a name too, like “Heroine Hannah” or “Brave Ben”. Next time Dora starts ranting that you’re not enough, you can say, “Ugh, here goes Dora again,” and invite Hannah to speak up.",
    fields=["My inner critic is called…", "My inner hero is called…", "One nasty thing my inner critic often says (is it 100% true?)…", "The comeback from my inner hero, as if talking to my best mate…"],
)
DOUBT_TOOLS = [
    ("Pause & breathe", "When anxiety or imposter feelings flood in, pause. Take a deep breath in, hold for 5 seconds, then exhale slowly. Do this a few times. It sounds basic, but it works. Then acknowledge the doubt without judgment: “I see you, fear. You’re trying to protect me, but I’m still in charge.”"),
    ("Don’t believe everything you think", "Your mind spits out thousands of thoughts a day, and not all of them are true or useful. Treat doubtful thoughts like passing clouds, not facts carved in stone. Ask: “What evidence do I have for this?” Question it, shrink it, rewrite it. A thought is just a thought, not a prophecy."),
    ("Flip the script", "Replace “I can’t do this” with “I can try, and that’s enough for now.” Replace “I’m not as good as them” with “I’m learning, and every expert was once a beginner.” This isn’t fake positivity. It’s seeing the whole picture. Write down a mantra that fits you, like “I’ve got this, one step at a time,” and keep it where you can see it."),
    ("Remember your why", "When fear kicks in, reconnect with your purpose. Why did you want to do this in the first place? Purpose fuels courage. Finish this sentence in your journal: “I want to do ___ because ___.” Make the second blank something that fires you up, not “because I have to”."),
    ("Tiny action, big wins", "The longer you sit paralysed by doubt, the stronger it grows. So do one teeny step. Open a new document and write one sentence. Send one text. Say hi once. Or use the rocket launch: count down 5, 4, 3, 2, 1 and go, before your mind talks you out of it. Action first, confidence second."),
    ("Show perfectionism the door", "A lot of doubt comes from thinking you need to be perfect. Perfection is not only impossible, it’s the enemy of progress. Aim for learning, not perfecting. Write this somewhere: progress over perfection. Done is better than perfect. Each “failure” is just an event, not a definition of you."),
    ("Phone a friend", "Don’t isolate yourself. Talk to someone you trust: a friend, sibling, parent, mentor. Telling someone “Honestly, I’m really doubting myself” can be a relief, and a true friend will remind you of your strengths when you can’t see them. As Brené Brown teaches, vulnerability isn’t weakness. It’s courage. Even superheroes have sidekicks."),
    ("Talk to yourself like you would to a younger sibling", "We’re often our own worst critics. But if your little brother, sister or best friend said, “I feel like a total failure,” you wouldn’t agree and tell them to give up. You’d encourage them. You deserve the same kindness. Try: “Okay, I’m feeling like a fraud, but hey, so does everyone sometimes.”"),
]
DOUBT_BOOSTERS = [
    ("Power pose", "Stand up, roll your shoulders back, hands on hips like a superhero. Chin up. Take up space. Hold for 30 seconds. Some people find it helps them feel braver. Try it and see."),
    ("Music therapy", "Blast your favourite pump-up song for a minute or two."),
    ("Visualise victory", "Close your eyes and imagine yourself after you’ve pushed through the doubt and succeeded. Let that future pride fuel your present action."),
    ("Affirmation attack", "Write an empowering statement on a sticky note and stick it where you’ll see it every day."),
]
DOUBT_CHALLENGE = [
    ("p", "You’ve got the knowledge. You’ve got the tools. Now it’s go time. When the doubt comes (and it will), you have a choice. You can feed the inner villain, or you can fuel your inner hero. You hold the reins, not your fear."),
    ("q", "The challenge: do one brave thing in the next 24 hours. It doesn’t have to be huge or perfect. Just one thing that nudges you out of your comfort zone despite the self-doubt. The smaller and more immediate, the better."),
    ("p", "Some ideas: speak up about an idea you’ve been quiet about. Apply for that opportunity you’ve been avoiding. Start a conversation with someone you’d like to know better. Try a skill that intrigues you, even if you might be terrible at first."),
    ("p", "Then journal about it. What did you do? How did you feel before, during, after? What did you learn about yourself? Even if it was awkward, you’re still here, still breathing, and now a little bit stronger and wiser. That is success."),
]
DOUBT_PROMPTS = [
    "What is the one brave thing you will do?",
    "How did you feel before, during, and after? What did you learn about yourself?",
]
TOOLKIT = [
    ("Pause & breathe", "Slow your breath to calm your body and clear your mind."),
    ("Name the doubt", "Say it out loud: “This is self-doubt. This is fear.” Labelling it gives you power over it."),
    ("5-4-3-2-1 go", "Don’t overthink. Count down from 5 and move. Action beats anxiety."),
    ("Flip “I’m nervous” to “I’m excited”", "Adrenaline is fuel, not fear."),
    ("Talk to your inner hero", "Replace “I can’t” with “I’m learning.” Be on your own team."),
    ("Connect to your why", "Ask yourself, “Why does this matter to me?” Let purpose override panic."),
    ("Tiny step forward", "Don’t freeze. Text someone. Write one sentence. Show up."),
    ("Progress over perfection", "It’s okay to be messy. Brave is better than perfect."),
    ("Phone a friend", "Don’t go it alone. Reach out to someone who reminds you who you are."),
    ("Hype yourself up", "Posture. Music. Mantra. Get your body and brain into confidence mode."),
]

# ---------------------------------------------------------------- new pages (drafted for review)
WELLBEING = dict(
    title="If things feel too heavy", sub="For the days when it feels like more than a bad day.",
    p1="This journal can help you notice your thoughts and feelings. It cannot replace people, and it is not a substitute for professional support.",
    p2="If you feel low, anxious or hopeless for more than a couple of weeks, or the thoughts get heavy, tell someone today. You can start with one sentence: “I’m not okay and I need some help.”",
    talk=["A parent, carer or another adult you trust.", "A teacher, mentor or school counsellor.", "Your doctor.", "A friend, and then an adult together."],
    now="If you are in danger or might hurt yourself, call your local emergency number straight away: 112 in the EU, 999 in the UK, 911 in the US.",
    lines=["UK: Childline, 0800 1111.", "US: 988 Suicide and Crisis Lifeline. Call or text 988.", "Poland: Telefon Zaufania dla Dzieci i Młodzieży, 116 111.", "Anywhere else: findahelpline.com lists services by country."],
    note="Asking for help is the brave thing, as chapter 14 says. Helpline details can change, so check they are current.",
)
PROJECT_STEPS = [("The idea", "the problem, and who it is for"), ("My first version", "what I made, and how fast"), ("Feedback I got", "who I asked, what they said"), ("What failed", "and what it told me"), ("What I changed", ""), ("The final project", "what I am showing the world"), ("What I learned about myself", "")]
REAL_PEOPLE = dict(
    title="Talk to Real People", sub="The fastest way to test an idea is to ask the people it is for.",
    intro="People are polite. If you ask “Would you buy this?”, most will say yes. Ask about their life instead, and listen. Don’t pitch. Write down their exact words.",
    qs=["Tell me about the last time you had this problem.", "What did you do about it?", "What was the hardest or most annoying part?", "Have you ever paid for anything to fix it?", "Who else should I talk to?"],
)
CLOSING = dict(
    title="Keep going.", sub="This journal is the inner game. Now go and build something real.",
    text="Teenpreneurs is a live online programme for teenagers aged 13 to 18. Real projects, a small international group, and a Portfolio of Proof of what you made. No business idea needed.",
)
COPYRIGHT = [
    "The Teenpreneur Journal: For Dreamers, Doers & Difference-Makers",
    "© 2026 Milena Rudd. All rights reserved.",
    "No part of this publication may be reproduced or transmitted in any form without prior written permission from the author, except for brief quotations used in reviews, educational settings, or personal reflection.",
    "This journal was designed to inspire, not prescribe. It is for educational and motivational purposes only and is not a substitute for professional mental health support.",
]

CHANGES = """\
EDITORIAL CHANGES IN v6 (everything beyond layout)

Punctuation (whole book)
- Em dashes replaced with commas, full stops or colons. Wording otherwise untouched.

Accuracy
- Apple "Think Different" quote now matches the advert's wording and is credited to Apple, not Steve Jobs.
- Ch 8: Michael Jordan did not make varsity in his second year (he was not "cut from the team"). Jobs "pushed out" instead of "fired".
- Ch 8: added The Beatles example (your draft had a note to add it). Decca turned them down in 1962.
- Doubt chapter: removed "Harvard researchers found 70% of top executives" (not a reliable claim). Now says imposter syndrome is very common.
- Doubt chapter: removed the Theodore Roosevelt attribution for "comparison is the thief of joy" (the attribution is unproven).
- Doubt chapter: removed the Marie Forleo "growth moments" attribution (could not be verified) and the claim that perfectionism is "the lowest standard".
- Power pose: removed "it's hard to feel defeated when your body says I'm confident". Now says some people find it helps.
- Ch 1: "designed during the industrial era to prepare people for factories" is now "took shape in the industrial era". Ch 2: "most schools are designed to" is now "many schools reward".

Tone and safety
- "Give Perfectionism the Middle Finger" is now "Show Perfectionism the Door". Emojis removed.
- "feel like crap" and "suck" avoided. Journaling is no longer described as "like therapy you can carry in your pocket".
- Ch 1: added two sentences saying the journal is not against school (matches unickorns.com: "it doesn't replace school").
- Ch 6: added a line on staying safe when looking for communities online. Ch 7: added a line to talk to a parent before selling anything.
- Ch 9: added a callout "If a system keeps falling apart, the system is the problem, not you".
- Intro and Ch 3 and others: added "You don't have to answer every question. Start with the one that pulls you."

Condensed
- "When the Doubt Comes" is condensed from about 2,400 words to short tool cards. The best ideas and lines are kept.

New pages (drafted by Claude, please review)
- Contents page. "Think Alongside AI" bonus chapter. "If things feel too heavy". "My Project Log". "Talk to Real People". Closing page with unickorns.com and a QR code.
- Author line now names uNickorns and uNick Academy.

Illustrations (added after v6.0)
- 23 bold outline doodles in the style of the WAKE UP alarm clock: one for each chapter, four part openers, the doubt chapter, toolkit, commitment, wellbeing page and more.
- Drawn as vectors, so they print sharp and take each chapter's colour automatically. Chapter 1 keeps your conveyor belt illustration.
- Where a chapter has no room beside the text, the drawing moves into the colour band so no page is added.

Starter Edition (the lead magnet)
- A 40 page version for download: Start here page, foreword and intro, chapters 1, 2, 4 and 8, Think Alongside AI, the Emergency Toolkit, Commitment, Talk to Real People, My Project Log, If things feel too heavy, then a page for teens and a page for parents with the Founding Cohort details and tracked links.
- Clickable contents, PDF bookmarks, a FREE sticker on the cover. Edit the dates and prices in content.py (CTA) when they change.
"""


# ================================================================ STARTER EDITION (lead magnet)
# Everything below is only used by the free Starter Edition. Facts come from unickorns.com as read on 24 Nov 2026.
# Update CTA when dates or prices change.
UTM = "utm_source=journal&utm_medium=lead-magnet&utm_campaign=starter-edition"
CTA = dict(
    apply_url="https://unickorns.com/apply?" + UTM,
    parents_url="https://unickorns.com/parents?" + UTM,
    cohort="Founding Cohort: starts 12 and 13 January 2027. Tuesday or Wednesday groups, up to 12 teens each. $70 / £50 / €60 a month for four months. 14 day money back guarantee.",
    intro_call="Free intro meeting on Zoom: 5 January 2027, 19:00 CET (18:00 UK, 13:00 New York).",
)
STARTER_CHAPTERS = [1, 2, 4, 8]
ART_FOR_CHAPTER = {2: "switch", 3: "sprout", 4: "brain", 5: "compass", 6: "friends", 7: "coins", 8: "flask", 9: "system",
                   10: "headphones", 11: "battery", 12: "signpost", 13: "megaphone", 14: "bubbles", 15: "book", "+": "robot"}

STARTER_COPYRIGHT_EXTRA = "Starter Edition. This is a free sample of the full Teenpreneur Journal: chapters 1, 2, 4 and 8, the Think Alongside AI bonus chapter, the Emergency Toolkit and two builder tools. For personal use. Please don’t pass it on. Your friends can download their own copy at unickorns.com."

STARTART = [
    ("p", "Three ways to use this journal. Pick whichever feels easiest."),
    ("h", "On a screen"),
    ("p", "Read it on a phone or tablet. Add your answers with a stylus, or in any notes app. Tap a line in the contents to jump straight to it."),
    ("h", "On paper"),
    ("p", "Print it at home. Each page is A5, so choose “2 pages per sheet” on A4 or Letter paper, or print one page at a time to write on."),
    ("h", "Just in your head"),
    ("p", "Pick one question and talk it through with someone you trust."),
    ("h", "Your first 10 minutes"),
    ("ol", ["Read Chapter 2, “You Are Not Lazy”, on page {{ref:ch2}}. It takes about four minutes.",
            "Answer the one question that pulls you most. Messy is fine.",
            "Try one tiny step from the Emergency Toolkit on page {{ref:toolkit}}."]),
    ("q", "You don’t have to finish it. You don’t have to go in order. Just show up."),
]

WHATNEXT_TEEN = [
    ("p", "You’ve just done the first part: asking better questions. Teenpreneurs is where you turn them into something real, with other teens, live."),
    ("h", "What Teenpreneurs is"),
    ("ul", ["A live online programme for teenagers aged 13 to 18, in English",
            "16 weekly 60 minute sessions, in small international groups of up to 12",
            "Real projects, guest sessions and a final Demo Day",
            "A Portfolio of Proof: evidence of what you made, decided and learned",
            "No business idea, no perfect English and no loud personality needed"]),
    ("h", "The Founding Cohort"),
    ("p", CTA["cohort"]),
    ("p", CTA["intro_call"]),
    ("q", "Every Teenpreneurs participant also gets the full Teenpreneur Journal: 15 chapters, more than 70 questions, and the whole “When the Doubt Comes” chapter."),
    ("cta", "Apply at unickorns.com", CTA["apply_url"], "Applications are open until the groups are full."),
]
WHATNEXT_PARENTS = [
    ("p", "Hello, I’m Milena. I’m a home educator of two teenagers, I have ADHD and dyslexia, and I wrote this journal because I wish I’d had it at 13."),
    ("h", "What it is"),
    ("p", "A place for your teen to think, not a programme to complete. Short chapters, honest questions and space to write. It is not therapy and not a substitute for professional support."),
    ("h", "How you can help"),
    ("ul", ["Let them choose where to start. The question that pulls them is the right one.",
            "Ask what they noticed or made, not what they got right.",
            "Don’t ask to read it. The journal works because it is private.",
            "If something worries you, see “If things feel too heavy” on page {{ref:wellbeing}}."]),
    ("h", "About Teenpreneurs"),
    ("p", "A live online programme for ages 13 to 18. It adds to school, it doesn’t replace it. Before enrolment, every family receives the mentor’s name, role and experience, and the safeguarding rules. The Founding Cohort is led personally by me."),
    ("cta", "Read the parents’ page", CTA["parents_url"], "unickorns.com/parents"),
]
