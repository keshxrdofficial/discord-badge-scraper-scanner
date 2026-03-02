const fs = require('fs');
const path = require('path');
const { Client } = require('discord.js-selfbot-v13');
const colors = require('colors');

let progressInterval = null;

const BOT_TOKEN = '';


const badgeDefinitions = {
    PremiumEarlySupporter: { name: 'Early Supporter', color: 'yellow', rarity: 50 },
    HypeSquadEvents: { name: 'HypeSquad Events', color: 'yellow', rarity: 70 },
    Partner: { name: 'Partner', color: 'cyan', rarity: 80 },
    BugHunterLevel1: { name: 'Bug Hunter Level 1', color: 'green', rarity: 90 },
    BugHunterLevel2: { name: 'Bug Hunter Level 2', color: 'red', rarity: 100 },
    VerifiedDeveloper: { name: 'Early Verified Bot Developer', color: 'cyan', rarity: 60 },
    CertifiedModerator: { name: 'Certified Moderator', color: 'blue', rarity: 100 },
    Staff: { name: 'Discord Staff', color: 'red', rarity: 100 },
};

function rgbColor(r, g, b, text) {
    return `\x1b[38;2;${r};${g};${b}m${text}\x1b[0m`;
}

function rgbGradient(text, startR, startG, startB, endR, endG, endB) {
    let result = '';
    for (let i = 0; i < text.length; i++) {
        const ratio = i / (text.length - 1);
        const r = Math.round(startR + (endR - startR) * ratio);
        const g = Math.round(startG + (endG - startG) * ratio);
        const b = Math.round(startB + (endB - startB) * ratio);
        result += rgbColor(r, g, b, text[i]);
    }
    return result;
}

function rainbowText(text, offset = 0) {
    let result = '';
    for (let i = 0; i < text.length; i++) {
        const hue = ((i + offset) * 137.508) % 360;
        const r = Math.round(255 * Math.sin((hue / 360) * 2 * Math.PI + 0) * 0.5 + 0.5);
        const g = Math.round(255 * Math.sin((hue / 360) * 2 * Math.PI + 2) * 0.5 + 0.5);
        const b = Math.round(255 * Math.sin((hue / 360) * 2 * Math.PI + 4) * 0.5 + 0.5);
        result += rgbColor(r, g, b, text[i]);
    }
    return result;
}

function createProgressBar(current, total, width = 40) {
    const percentage = Math.min(100, (current / total) * 100);
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;
    
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    return bar;
}

function showBanner() {
    console.clear();
    console.log('\n');
    const banner = [
        '  ╔═══════════════════════════════════════════════════════════╗',
        '  ║                                                           ║',
        '  ║        Discord Badge Scanner v2.0.0                      ║',
        '  ║                                                           ║',
        '  ╚═══════════════════════════════════════════════════════════╝'
    ];
    
    banner.forEach((line, idx) => {
        if (idx === 2) {
            console.log(rainbowText(line, Date.now() / 50));
        } else {
            console.log(rgbColor(0, 200, 255, line));
        }
    });
    console.log('\n');
}

function getActiveBadges() {
    // Sadece belirtilen badge'leri aktif yap
    return [
        'PremiumEarlySupporter',      // Early Supporter
        'HypeSquadEvents',            // HypeSquad Events
        'VerifiedDeveloper',          // Early Verified Bot Developer
        'Partner',                    // Partner
        'BugHunterLevel1',            // Bug Hunter Level 1
        'BugHunterLevel2',             // Bug Hunter Level 2
        'CertifiedModerator',          // +QBQW%ÇBqçB%QWÇ:%BQW:B%QW:
        'Staff',                        // Vuramicaksın boşuna bakma
    ];
}

const flagMapping = {
    'ActiveDeveloper': ['ACTIVE_DEVELOPER', 'ActiveDeveloper'],
    'PremiumEarlySupporter': ['EARLY_SUPPORTER', 'PremiumEarlySupporter'],
    'HypeSquadEvents': ['HYPESQUAD_EVENTS', 'HypeSquadEvents'],
    'HypeSquadOnlineHouse1': ['HOUSE_BRAVERY', 'HypeSquadOnlineHouse1'],
    'HypeSquadOnlineHouse2': ['HOUSE_BRILLIANCE', 'HypeSquadOnlineHouse2'],
    'HypeSquadOnlineHouse3': ['HOUSE_BALANCE', 'HypeSquadOnlineHouse3'],
    'BugHunterLevel1': ['BUG_HUNTER_LEVEL_1', 'BugHunterLevel1'],
    'BugHunterLevel2': ['BUG_HUNTER_LEVEL_2', 'BugHunterLevel2'],
    'VerifiedBot': ['VERIFIED_BOT', 'VerifiedBot'],
    'VerifiedDeveloper': ['VERIFIED_BOT_DEVELOPER', 'VerifiedDeveloper'],
    'CertifiedModerator': ['CERTIFIED_MODERATOR', 'CertifiedModerator'],
    'Staff': ['STAFF', 'Staff'],
    'Partner': ['PARTNER', 'Partner'],
    'Hypesquad': ['HYPESQUAD', 'Hypesquad']
};

function getAllBadgesFromFlags(flags) {
    const badges = [];
    const filters = {}; // All badges enabled by default
    
    if (filters.hypesquadevents === true) {
        if (flags.includes('HYPESQUAD_EVENTS') || flags.includes('HypeSquadEvents')) badges.push('HypeSquad Events');
    }
    if (filters.hypesquad === true) {
        if (flags.includes('HOUSE_BRILLIANCE') || flags.includes('HypeSquadOnlineHouse2')) badges.push('HypeSquad Brilliance');
        if (flags.includes('HOUSE_BRAVERY') || flags.includes('HypeSquadOnlineHouse1')) badges.push('HypeSquad Bravery');
        if (flags.includes('HOUSE_BALANCE') || flags.includes('HypeSquadOnlineHouse3')) badges.push('HypeSquad Balance');
        if (flags.includes('HYPESQUAD') || flags.includes('Hypesquad')) badges.push('HypeSquad');
    }
    if (filters.earlySupporter === true) {
        if (flags.includes('EARLY_SUPPORTER') || flags.includes('PremiumEarlySupporter')) badges.push('Early Supporter');
    }
    if (filters.earlyVerifiedBotDev === true) {
        if (flags.includes('VERIFIED_BOT_DEVELOPER') || flags.includes('VerifiedDeveloper')) badges.push('Early Verified Bot Developer');
    }
    if (filters.partner === true) {
        if (flags.includes('PARTNER') || flags.includes('Partner')) badges.push('Discord Partner');
    }
    if (filters.bugHunter === true) {
        if (flags.includes('BUG_HUNTER_LEVEL_1') || flags.includes('BugHunterLevel1')) badges.push('Bug Hunter Level 1');
        if (flags.includes('BUG_HUNTER_LEVEL_2') || flags.includes('BugHunterLevel2')) badges.push('Bug Hunter Level 2');
    }
    if (filters.verified === true) {
        if (flags.includes('VERIFIED_BOT') || flags.includes('VerifiedBot')) badges.push('Verified Bot');
    }
    if (filters.developer === true) {
        if (flags.includes('ACTIVE_DEVELOPER') || flags.includes('ActiveDeveloper')) badges.push('Active Developer');
    }
    if (filters.staff === true) {
        if (flags.includes('STAFF') || flags.includes('Staff')) badges.push('Discord Staff');
    }
    if (filters.certifiedModerator === true) {
        if (flags.includes('CERTIFIED_MODERATOR') || flags.includes('CertifiedModerator')) badges.push('Certified Moderator');
    }
    if (filters.nitro === true) {
        if (flags.includes('NITRO') || flags.includes('Nitro')) badges.push('Nitro');
        if (flags.includes('PREMIUM') || flags.includes('Premium')) badges.push('Premium');
    }
    
    return badges;
}

function scanUserBadges(user, member = null) {
    let flags = [];
    try {
        const userObj = member?.user || user;
        
        if (userObj?.flags) {
            if (typeof userObj.flags.toArray === 'function') {
                flags = userObj.flags.toArray();
            } else if (Array.isArray(userObj.flags)) {
                flags = userObj.flags;
            } else if (userObj.flags.bitfield !== undefined) {
                try {
                    flags = userObj.flags.toArray();
                } catch (e) {
                    flags = [];
                }
            }
        }
        
        if (userObj?.publicFlags) {
            try {
                let publicFlags = [];
                if (typeof userObj.publicFlags.toArray === 'function') {
                    publicFlags = userObj.publicFlags.toArray();
                } else if (Array.isArray(userObj.publicFlags)) {
                    publicFlags = userObj.publicFlags;
                } else if (userObj.publicFlags.bitfield !== undefined) {
                    try {
                        publicFlags = userObj.publicFlags.toArray();
                    } catch (e) {
                        publicFlags = [];
                    }
                }
                flags = [...new Set([...flags, ...publicFlags])];
            } catch (e) {
                // Ignore
            }
        }
        
        if (member?.user?.flags && member.user !== userObj) {
            try {
                let memberFlags = [];
                if (typeof member.user.flags.toArray === 'function') {
                    memberFlags = member.user.flags.toArray();
                } else if (Array.isArray(member.user.flags)) {
                    memberFlags = member.user.flags;
                }
                flags = [...new Set([...flags, ...memberFlags])];
            } catch (e) {
                // Ignore
            }
        }
        
        if (userObj?.flags?.bitfield !== undefined) {
            try {
                const bitfield = userObj.flags.bitfield;
                const Flags = require('discord.js-selfbot-v13').UserFlags || {};
                if (bitfield & (Flags.EARLY_VERIFIED_BOT_DEVELOPER || 131072)) flags.push('VERIFIED_BOT_DEVELOPER');
                if (bitfield & (Flags.DISCORD_EMPLOYEE || 1)) flags.push('STAFF');
                if (bitfield & (Flags.PARTNERED_SERVER_OWNER || 2)) flags.push('PARTNER');
                if (bitfield & (Flags.HYPESQUAD_EVENTS || 4)) flags.push('HYPESQUAD_EVENTS');
                if (bitfield & (Flags.BUG_HUNTER_LEVEL_1 || 8)) flags.push('BUG_HUNTER_LEVEL_1');
                if (bitfield & (Flags.HOUSE_BRAVERY || 64)) flags.push('HOUSE_BRAVERY');
                if (bitfield & (Flags.HOUSE_BRILLIANCE || 128)) flags.push('HOUSE_BRILLIANCE');
                if (bitfield & (Flags.HOUSE_BALANCE || 256)) flags.push('HOUSE_BALANCE');
                if (bitfield & (Flags.EARLY_SUPPORTER || 512)) flags.push('EARLY_SUPPORTER');
                if (bitfield & (Flags.BUG_HUNTER_LEVEL_2 || 16384)) flags.push('BUG_HUNTER_LEVEL_2');
                if (bitfield & (Flags.VERIFIED_BOT || 65536)) flags.push('VERIFIED_BOT');
                if (bitfield & (Flags.EARLY_VERIFIED_BOT_DEVELOPER || 131072)) flags.push('VERIFIED_BOT_DEVELOPER');
                if (bitfield & (Flags.CERTIFIED_MODERATOR || 262144)) flags.push('CERTIFIED_MODERATOR');
                if (bitfield & (Flags.ACTIVE_DEVELOPER || 4194304)) flags.push('ACTIVE_DEVELOPER');
            } catch (e) {
                // Ignore
            }
        }
        
        if (member?.user?.flags?.bitfield !== undefined && member.user !== userObj) {
            try {
                const bitfield = member.user.flags.bitfield;
                if (bitfield & 131072) flags.push('VERIFIED_BOT_DEVELOPER');
                if (bitfield & 4) flags.push('HYPESQUAD_EVENTS');
                if (bitfield & 512) flags.push('EARLY_SUPPORTER');
                if (bitfield & 8) flags.push('BUG_HUNTER_LEVEL_1');
                if (bitfield & 16384) flags.push('BUG_HUNTER_LEVEL_2');
                if (bitfield & 65536) flags.push('VERIFIED_BOT');
                if (bitfield & 2) flags.push('PARTNER');
                if (bitfield & 262144) flags.push('CERTIFIED_MODERATOR');
            } catch (e) {
                // Ignore
            }
        }
    } catch (error) {
        flags = [];
    }
    
    const foundBadges = [];
    const activeBadges = getActiveBadges();
    
    activeBadges.forEach(badgeKey => {
        const flagNames = flagMapping[badgeKey];
        
        if (flagNames && Array.isArray(flagNames)) {
            for (const flagName of flagNames) {
                if (flags.includes(flagName)) {
                    foundBadges.push(badgeKey);
                    break;
                }
            }
        } else if (flags.includes(badgeKey)) {
            if (!foundBadges.includes(badgeKey)) {
                foundBadges.push(badgeKey);
            }
        }
    });
    
    if (activeBadges.includes('Nitro') || activeBadges.includes('Premium')) {
        const hasPremium = (user?.premiumSince !== null) || (user?.premium) || (member?.premiumSince !== null);
        if (hasPremium) {
            if (activeBadges.includes('Nitro') && !foundBadges.includes('Nitro')) {
                foundBadges.push('Nitro');
            }
            if (activeBadges.includes('Premium') && !foundBadges.includes('Premium')) {
                foundBadges.push('Premium');
            }
        }
    }
    
    if (activeBadges.includes('Nitro24Months')) {
        const premiumSince = member?.premiumSince || user?.premiumSince;
        if (premiumSince) {
            try {
                const premiumDate = premiumSince instanceof Date ? premiumSince : new Date(premiumSince);
                const monthsDiff = (Date.now() - premiumDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
                if (monthsDiff >= 24 && !foundBadges.includes('Nitro24Months')) {
                    foundBadges.push('Nitro24Months');
                }
            } catch (e) {
                // Ignore
            }
        }
    }
    
    const allBadgesList = getAllBadgesFromFlags(flags);
    if (activeBadges.includes('Nitro24Months')) {
        const premiumSince = member?.premiumSince || user?.premiumSince;
        if (premiumSince) {
            try {
                const premiumDate = premiumSince instanceof Date ? premiumSince : new Date(premiumSince);
                const monthsDiff = (Date.now() - premiumDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
                if (monthsDiff >= 24 && !allBadgesList.includes('Nitro (24 ay)')) {
                    allBadgesList.push('Nitro (24 ay)');
                }
            } catch (e) {
                // Ignore
            }
        }
    }
    
    return {
        hasBadges: foundBadges.length > 0,
        badges: foundBadges,
        allFlags: flags,
        allBadges: allBadgesList
    };
}

function updateProgressDisplay(processed, total, found, startTime, animated = false) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const rate = processed > 0 ? (processed / elapsed).toFixed(0) : '0';
    const percentage = total > 0 ? ((processed / total) * 100).toFixed(1) : '0';
    const remaining = rate > 0 ? Math.ceil((total - processed) / rate) : 0;
    
    const bar = createProgressBar(processed, total, 35);
    const barColored = rgbGradient(bar, 0, 255, 0, 255, 255, 0);
    
    const spinner = animated ? ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'][Math.floor(Date.now() / 100) % 10] : '●';
    const spinnerColor = rgbColor(0, 255, 255, spinner);
    
    const stats = `${rgbColor(100, 200, 255, processed.toString())}${rgbColor(200, 200, 200, '/')}${rgbColor(100, 200, 255, total.toString())} ${rgbColor(200, 200, 200, '(')}${rgbColor(255, 255, 0, percentage + '%')}${rgbColor(200, 200, 200, ')')} | ${rgbColor(0, 255, 0, 'Found:')} ${rgbColor(255, 255, 255, found.toString())} | ${rgbColor(255, 200, 0, 'Rate:')} ${rgbColor(255, 255, 255, rate + '/s')} | ${rgbColor(255, 100, 100, 'ETA:')} ${rgbColor(255, 255, 255, remaining + 's')}`;
    
    process.stdout.write(`\r  ${spinnerColor} ${barColored} | ${stats}`);
}

async function processGuild(guild) {
    const activeBadges = getActiveBadges();
    
    if (activeBadges.length === 0) {
        console.log('  ' + rgbColor(255, 255, 0, '[WARN]'), rgbColor(255, 255, 255, 'No active badges configured'));
        console.log('  ' + rgbColor(100, 200, 255, '[INFO]'), rgbColor(255, 255, 255, 'Enable at least one badge in config.json'));
        console.log('');
        return { allBadgeUsers: [], processed: 0, totalFound: 0, elapsed: 0, actualMemberCount: 0 };
    }

    console.log('\n  ' + rgbGradient('═'.repeat(60), 0, 200, 255, 100, 150, 255));
    console.log('  ' + rgbColor(0, 255, 255, 'Guild Information').bold);
    console.log('  ' + rgbGradient('═'.repeat(60), 0, 200, 255, 100, 150, 255));
    console.log('  ' + rgbColor(255, 255, 0, 'Name:'), rgbColor(255, 255, 255, guild.name));
    console.log('  ' + rgbColor(255, 255, 0, 'ID:'), rgbColor(255, 255, 255, guild.id));
    console.log('  ' + rgbColor(255, 255, 0, 'Member Count:'), rgbColor(255, 255, 255, guild.memberCount.toString()));
    console.log('  ' + rgbColor(255, 255, 0, 'Active Badges:'), rgbColor(255, 255, 255, activeBadges.length.toString()));
    console.log('  ' + rgbGradient('═'.repeat(60), 0, 200, 255, 100, 150, 255));
    
    console.log('\n  ' + rgbColor(255, 255, 0, 'Target Badges:'));
    activeBadges.forEach(badgeKey => {
        const badgeInfo = badgeDefinitions[badgeKey] || { name: badgeKey };
        console.log(`    ${rgbColor(0, 255, 0, '-')} ${rgbColor(255, 255, 255, badgeInfo.name)}`);
    });
    
    console.log('\n  ' + rgbColor(100, 200, 255, '[INFO]'), rgbColor(255, 255, 255, 'Loading members...'));
    console.log('');

    const results = {};
    activeBadges.forEach(badgeKey => {
        results[badgeKey] = [];
    });
    results.combined = [];
    results.processed = 0;
    results.totalFound = 0;

    const startTime = Date.now();
    let lastUpdateTime = startTime;
    let animationFrame = 0;

    try {
        const delayMs = 0;
        const showProgress = true;
        const skipBots = true;
        const fetchTimeout = 60000;
        const maxRetries = 2;
        const retryDelay = 300;
        const onlyTargetBadges = true;
        const useFastFetch = false;
        const processingBatchSize = 200;

        let members = new Map();
        let fetchSuccess = false;
        const fetchStartTime = Date.now();
        
        console.log('  ' + rgbColor(100, 200, 255, '[INFO]'), rgbColor(255, 255, 255, `Fetching all members (${guild.memberCount} members)...`));
        
        async function fetchAllMembers() {
            try {
                console.log('  ' + rgbColor(100, 200, 255, '[INFO]'), rgbColor(255, 255, 255, 'Attempting direct fetch first...'));
                
                try {
                    const directFetch = await Promise.race([
                        guild.members.fetch(),
                        new Promise((_, reject) => 
                            setTimeout(() => reject(new Error('Direct fetch timeout')), 180000)
                        )
                    ]);
                    
                    if (directFetch && directFetch.size > 0) {
                        directFetch.forEach((member, id) => members.set(id, member));
                        const progress = ((members.size / guild.memberCount) * 100).toFixed(1);
                        console.log('  ' + rgbColor(0, 255, 0, '[SUCCESS]'), rgbColor(255, 255, 255, `Direct fetch: ${members.size}/${guild.memberCount} (${progress}%)`));
                        
                        // Discord API limiti genellikle 9000-9500 arası, eğer bu aralıktaysa chunked fetch'i kısa deneyip başarısız olursa direkt devam et
                        if (members.size >= 9000 && members.size <= 9500) {
                            console.log('  ' + rgbColor(255, 255, 0, '[WARN]'), rgbColor(255, 255, 255, `Discord API limit detected (~${members.size} members). Will try chunked fetch briefly, then continue with current members.`));
                        }
                        
                        if (members.size >= guild.memberCount * 0.95) {
                            return true;
                        }
                    }
                } catch (directError) {
                    console.log('  ' + rgbColor(255, 255, 0, '[INFO]'), rgbColor(255, 255, 255, `Direct fetch incomplete, using chunked fetch...`));
                }
                
                // Eğer direct fetch'ten sonra üye varsa chunked fetch'e geç
                if (members.size > 0 && members.size < guild.memberCount * 0.95) {
                    console.log('  ' + rgbColor(100, 200, 255, '[INFO]'), rgbColor(255, 255, 255, `Attempting chunked fetch to get more members (will timeout quickly if limit reached)...`));
                } else if (members.size === 0) {
                    console.log('  ' + rgbColor(100, 200, 255, '[INFO]'), rgbColor(255, 255, 255, `Starting chunked fetch from beginning...`));
                }
                
                let lastId = null;
                if (members.size > 0) {
                    const sortedMembers = Array.from(members.values()).sort((a, b) => a.user.id.localeCompare(b.user.id));
                    lastId = sortedMembers[sortedMembers.length - 1].user.id;
                }
                
                let fetchCount = 0;
                const chunkSize = 1000;
                const maxChunks = Math.ceil(guild.memberCount / chunkSize) + 50;
                let consecutiveErrors = 0;
                const maxConsecutiveErrors = 2; // Çok hızlı devam etmek için azaltıldı
                const fetchTimeout = 10000; // Timeout'u çok kısa yaptık (10 saniye)
                const maxStuckAttempts = 2; // Aynı sayıda takılırsa dur
                let stuckCount = 0;
                let lastMemberSize = members.size;
                const chunkedFetchStartTime = Date.now();
                const maxChunkedFetchTime = 15000; // 15 saniye içinde başarısız olursa direkt devam et
                
                // Eğer 9000-9500 arası üye varsa, chunked fetch'i çok kısa deneyip başarısız olursa direkt devam et
                const isLikelyAtLimit = members.size >= 9000 && members.size <= 9500;
                
                while (fetchCount < maxChunks && members.size < guild.memberCount * 0.995) {
                    // Eğer limit'teysek ve 15 saniye geçtiyse veya 2 deneme yaptıysak direkt devam et
                    if (isLikelyAtLimit && (Date.now() - chunkedFetchStartTime > maxChunkedFetchTime || fetchCount >= 2)) {
                        if (fetchCount === 0) {
                            console.log(`\n  ${rgbColor(255, 255, 0, '[WARN]')} ${rgbColor(255, 255, 255, `Discord API limit reached. Continuing with ${members.size} members from direct fetch...`)}`);
                        } else {
                            console.log(`\n  ${rgbColor(255, 255, 0, '[WARN]')} ${rgbColor(255, 255, 255, `Chunked fetch timeout/limit reached after ${fetchCount} attempts. Continuing with ${members.size} members...`)}`);
                        }
                        break;
                    }
                    try {
                        const fetchOptions = { limit: chunkSize };
                        if (lastId) {
                            fetchOptions.after = lastId;
                        }
                        
                        const chunkStartTime = Date.now();
                        const chunk = await Promise.race([
                            guild.members.fetch(fetchOptions),
                            new Promise((_, reject) => 
                                setTimeout(() => reject(new Error('Timeout')), fetchTimeout)
                            )
                        ]);
                        
                        if (chunk && chunk.size > 0) {
                            const beforeSize = members.size;
                            chunk.forEach((member, id) => members.set(id, member));
                            const lastMember = Array.from(chunk.values())[chunk.size - 1];
                            lastId = lastMember.user.id;
                            fetchCount++;
                            consecutiveErrors = 0;
                            
                            // Eğer yeni üye eklenmediyse (aynı üyeler tekrar geliyorsa)
                            if (members.size === beforeSize) {
                                stuckCount++;
                                if (stuckCount >= maxStuckAttempts) {
                                    console.log(`\n  ${rgbColor(255, 255, 0, '[WARN]')} ${rgbColor(255, 255, 255, `No new members fetched after ${maxStuckAttempts} attempts. Discord API limit reached. Continuing with ${members.size} members...`)}`);
                                    break;
                                }
                            } else {
                                stuckCount = 0;
                            }
                            
                            // Eğer üye sayısı değişmediyse (limit'e takıldıysa)
                            if (members.size === lastMemberSize && fetchCount > 1) {
                                console.log(`\n  ${rgbColor(255, 255, 0, '[WARN]')} ${rgbColor(255, 255, 255, `Member count not increasing. Discord API limit may be reached. Continuing with ${members.size} members...`)}`);
                                break;
                            }
                            lastMemberSize = members.size;
                            
                            const progress = ((members.size / guild.memberCount) * 100).toFixed(1);
                            const elapsed = ((Date.now() - fetchStartTime) / 1000).toFixed(1);
                            const rate = elapsed > 0 ? (members.size / elapsed).toFixed(0) : '0';
                            const remaining = rate > 0 && rate !== '0' && parseFloat(rate) > 0 ? ((guild.memberCount - members.size) / parseFloat(rate)).toFixed(0) : '?';
                            process.stdout.write(`\r  ${rgbColor(100, 200, 255, '[FETCH]')} ${rgbColor(255, 255, 255, `${members.size}/${guild.memberCount} (${progress}%) | Chunk: ${fetchCount} | Rate: ${rate}/s | ETA: ${remaining}s`)}`);
                            
                            if (chunk.size < chunkSize) {
                                break;
                            }
                        } else {
                            // Boş chunk geldiyse, limit'e takıldık demektir
                            if (members.size > 0) {
                                console.log(`\n  ${rgbColor(255, 255, 0, '[WARN]')} ${rgbColor(255, 255, 255, `Empty chunk received. Discord API limit reached. Continuing with ${members.size} members...`)}`);
                                break;
                            }
                            break;
                        }
                    } catch (error) {
                        // Eğer limit'teysek ve ilk hatada direkt devam et
                        if (isLikelyAtLimit && fetchCount === 0 && members.size > 0) {
                            console.log(`\n  ${rgbColor(255, 255, 0, '[WARN]')} ${rgbColor(255, 255, 255, `Chunked fetch failed immediately. Discord API limit reached. Continuing with ${members.size} members...`)}`);
                            break;
                        }
                        
                        consecutiveErrors++;
                        
                        // Rate limit veya permission hatası varsa, mevcut üyelerle devam et
                        if (error.message.includes('rate limit') || error.message.includes('Missing Access') || error.message.includes('Missing Permissions')) {
                            if (members.size > 0) {
                                console.log(`\n  ${rgbColor(255, 255, 0, '[WARN]')} ${rgbColor(255, 255, 255, `${error.message}. Continuing with ${members.size} members...`)}`);
                                break;
                            }
                        }
                        
                        if (consecutiveErrors >= maxConsecutiveErrors) {
                            if (members.size >= guild.memberCount * 0.80) {
                                console.log(`\n  ${rgbColor(255, 255, 0, '[WARN]')} ${rgbColor(255, 255, 255, `Multiple consecutive errors (${consecutiveErrors}). Continuing with ${members.size} members (${((members.size/guild.memberCount)*100).toFixed(1)}%)...`)}`);
                                return members.size > 0;
                            } else if (members.size > 0) {
                                console.log(`\n  ${rgbColor(255, 255, 0, '[WARN]')} ${rgbColor(255, 255, 255, `Chunk ${fetchCount + 1} failed. Continuing with ${members.size} members...`)}`);
                                return members.size > 0;
                            } else {
                                throw new Error(`Failed to fetch members: ${error.message}`);
                            }
                        }
                        
                        if (consecutiveErrors % 2 === 0) {
                            console.log(`\n  ${rgbColor(255, 255, 0, '[WARN]')} ${rgbColor(255, 255, 255, `Chunk ${fetchCount + 1} error: ${error.message}. Retrying... (${consecutiveErrors}/${maxConsecutiveErrors})`)}`);
                        }
                        
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        continue;
                    }
                }
                
                console.log('');
                
                // Eğer hiç chunk çekilemediyse ama direct fetch'ten üye varsa, onlarla devam et
                if (fetchCount === 0 && members.size > 0) {
                    console.log('  ' + rgbColor(255, 255, 0, '[WARN]'), rgbColor(255, 255, 255, `Chunked fetch could not fetch additional members. Continuing with ${members.size} members from direct fetch...`));
                    return true;
                }
                
                return members.size > 0;
            } catch (error) {
                handleError(error, 'Member fetch');
                return false;
            }
        }
        
        fetchSuccess = await fetchAllMembers();
        
        if (!fetchSuccess || members.size === 0) {
            console.log('\n  ' + rgbColor(255, 0, 0, '[ERROR]'), rgbColor(255, 255, 255, 'Failed to fetch members'));
            return { allBadgeUsers: [], processed: 0, totalFound: 0, elapsed: 0, actualMemberCount: 0 };
        }

        console.log('  ' + rgbColor(0, 255, 0, '[SUCCESS]'), rgbColor(255, 255, 255, `${members.size} members fetched. Starting scan...`));
        
        const memberArray = Array.from(members.values());
        const actualMemberCount = memberArray.length;
        let allBadgeUsers = [];
        
        console.log('  ' + rgbColor(100, 200, 255, '[INFO]'), rgbColor(255, 255, 255, `Tüm kullanıcılar taranıyor (${actualMemberCount} kullanıcı)...`));
        dateFolderPath = null;
        const dateFolder = getDateFolder();
        console.log('  ' + rgbColor(100, 200, 255, '[INFO]'), rgbColor(255, 255, 255, `Kayıt klasörü: ${path.basename(dateFolder)}`));
        
        progressInterval = setInterval(() => {
            animationFrame++;
            updateProgressDisplay(results.processed, actualMemberCount, results.totalFound, startTime, true);
        }, 50);
        
        for (let i = 0; i < memberArray.length; i += processingBatchSize) {
            const batch = memberArray.slice(i, i + processingBatchSize);

            for (const member of batch) {
                if (skipBots && member.user.bot) {
                    continue;
                }
                
                results.processed++;
                
                try {
                    const badgeData = scanUserBadges(member.user, member);
                    
                    if (false && results.processed % 1000 === 0 && badgeData.allFlags.length > 0) {
                        console.log(`\n  [DEBUG] Sample flags: ${badgeData.allFlags.slice(0, 5).join(', ')}`);
                    }
                    
                    const roles = member.roles ? member.roles.cache
                        .filter(r => r.id !== guild.id)
                        .map(r => ({ id: r.id, name: r.name })) : [];
                    
                    if (badgeData.hasBadges && badgeData.badges.length > 0) {
                        results.totalFound++;
                        
                        if (results.totalFound % 10 === 0 || results.totalFound <= 5) {
                            updateProgressDisplay(results.processed, actualMemberCount, results.totalFound, startTime, false);
                        }
                        
                        const badgeNames = badgeData.allBadges && badgeData.allBadges.length > 0 
                            ? badgeData.allBadges.join(', ') 
                            : badgeData.badges.map(b => badgeDefinitions[b]?.name || b).join(', ');
                        
                        const userData = {
                            tag: member.user.tag,
                            id: member.user.id,
                            username: member.user.username,
                            discriminator: member.user.discriminator,
                            badges: badgeData.badges,
                            allBadges: badgeData.allBadges || [],
                            allFlags: badgeData.allFlags,
                            avatar: member.user.displayAvatarURL({ dynamic: true }),
                            avatarId: member.user.avatar,
                            banner: member.user.banner ? `https://cdn.discordapp.com/banners/${member.user.id}/${member.user.banner}.png` : null,
                            bio: member.user.bio || null,
                            createdAt: member.user.createdAt ? member.user.createdAt.toISOString() : null,
                            joinedAt: member.joinedAt ? member.joinedAt.toISOString() : null,
                            roles: roles,
                            premiumSince: member.premiumSince ? member.premiumSince.toISOString() : null,
                            premiumType: member.user.premiumType || null,
                            presence: member.presence ? {
                                status: member.presence.status,
                                activities: member.presence.activities ? member.presence.activities.map(a => ({
                                    type: a.type,
                                    name: a.name,
                                    state: a.state
                                })) : []
                            } : null,
                            badgeNames: badgeNames
                        };
                        
                        badgeData.badges.forEach(badgeKey => {
                            if (results[badgeKey]) {
                                results[badgeKey].push(userData);
                            }
                        });

                        if (badgeData.badges.length > 1) {
                            results.combined.push(userData);
                        }
                        
                        allBadgeUsers.push(userData);
                    }
                } catch (error) {
                    if (false) {
                        console.log(`\n  [DEBUG] Error scanning user ${member.user?.id}: ${error.message}`);
                    }
                }
            }
        }
        
        console.log('\n  ' + rgbColor(0, 255, 0, '[SUCCESS]'), rgbColor(255, 255, 255, `Tüm kullanıcılar tarandı! ${allBadgeUsers.length} badge'li kullanıcı bulundu.`));

        if (progressInterval) {
            clearInterval(progressInterval);
            progressInterval = null;
        }

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        updateProgressDisplay(results.processed, actualMemberCount, results.totalFound, startTime, false);
        console.log('\n');
        
        // Kullanıcıları rarity'ye göre sırala
        allBadgeUsers.sort((a, b) => {
            // Her kullanıcının en yüksek rarity değerini bul
            const getMaxRarity = (user) => {
                if (!user.badges || user.badges.length === 0) return 0;
                return Math.max(...user.badges.map(badgeKey => {
                    const badgeDef = badgeDefinitions[badgeKey];
                    return badgeDef?.rarity || 0;
                }));
            };
            
            const maxRarityA = getMaxRarity(a);
            const maxRarityB = getMaxRarity(b);
            
            // Yüksek rarity önce (azalan sıralama)
            return maxRarityB - maxRarityA;
        });
        
        displayResults(results, activeBadges, elapsed, actualMemberCount);
        
        // Return results for bot.js
        return {
            allBadgeUsers,
            processed: results.processed,
            totalFound: results.totalFound,
            elapsed,
            actualMemberCount
        };

    } catch (error) {
        if (progressInterval) {
            clearInterval(progressInterval);
            progressInterval = null;
        }
        console.log('\n');
        handleError(error, 'Guild processing');
        return { allBadgeUsers: [], processed: 0, totalFound: 0, elapsed: 0, actualMemberCount: 0 };
    }
}

function handleError(error, context = 'Operation') {
    console.error('\n  ' + rgbColor(255, 0, 0, '[ERROR]'), rgbColor(255, 255, 255, `${context} failed:`));
    console.error('  ' + rgbColor(255, 100, 100, 'Message:'), rgbColor(255, 255, 255, error.message));
    
    if (error.code) {
        console.error('  ' + rgbColor(255, 100, 100, 'Code:'), rgbColor(255, 255, 255, error.code));
    }
    
    if (error.stack && false) {
        console.error('\n  ' + rgbColor(200, 200, 200, 'Stack trace:'));
        error.stack.split('\n').slice(0, 5).forEach(line => {
            console.error('  ' + rgbColor(150, 150, 150, line));
        });
    }
    
    console.log('');
}

function displayResults(results, activeBadges, elapsed, actualMemberCount = null) {
    console.log('\n');
    console.log('  ' + rgbGradient('═'.repeat(60), 0, 255, 0, 0, 200, 100));
    console.log('  ' + rgbColor(0, 255, 0, 'Scan Results').bold);
    console.log('  ' + rgbGradient('═'.repeat(60), 0, 255, 0, 0, 200, 100));
    console.log('');
    if (actualMemberCount !== null) {
        console.log('  ' + rgbColor(255, 255, 0, 'Total Fetched:'), rgbColor(255, 255, 255, actualMemberCount.toString()).bold);
    }
    console.log('  ' + rgbColor(255, 255, 0, 'Total Processed:'), rgbColor(255, 255, 255, results.processed.toString()).bold);
    console.log('  ' + rgbColor(255, 255, 0, 'Users with Badges:'), rgbColor(255, 255, 255, results.totalFound.toString()).bold);
    console.log('  ' + rgbColor(255, 255, 0, 'Duration:'), rgbColor(255, 255, 255, elapsed.toString() + ' saniye').bold);
    console.log('  ' + rgbColor(255, 255, 0, 'Processing Rate:'), rgbColor(255, 255, 255, (results.processed / elapsed).toFixed(0) + ' users/s').bold);
    console.log('');

    const maxShow = 50;

    if (results.combined.length > 0) {
        console.log('  ' + rgbGradient('─'.repeat(60), 255, 0, 255, 200, 0, 200));
        console.log(`  ${rgbColor(255, 0, 255, 'Multiple Badge Holders')} ${rgbColor(200, 200, 200, '(')}${rgbColor(255, 255, 255, results.combined.length.toString())}${rgbColor(200, 200, 200, ')')}`.bold);
        console.log('  ' + rgbGradient('─'.repeat(60), 255, 0, 255, 200, 0, 200));
        results.combined.slice(0, maxShow).forEach((item, idx) => {
            const badgeNames = item.badges.map(b => badgeDefinitions[b]?.name || b).join(', ');
            console.log(`  ${rgbColor(0, 255, 255, (idx + 1).toString())}. ${rgbColor(255, 255, 255, item.tag)} ${rgbColor(150, 150, 150, '(')}${rgbColor(200, 200, 200, item.id)}${rgbColor(150, 150, 150, ')')}`);
            console.log(`      ${rgbColor(200, 200, 200, 'Badges:')} ${rgbColor(255, 255, 255, badgeNames)}`);
        });
        if (results.combined.length > maxShow) {
            console.log(`  ${rgbColor(200, 200, 200, '... and')} ${rgbColor(255, 255, 0, (results.combined.length - maxShow).toString())} ${rgbColor(200, 200, 200, 'more users')}`);
        }
        console.log('');
    }

    activeBadges.forEach(badgeKey => {
        const badgeList = results[badgeKey] || [];
        if (badgeList.length === 0) return;

        const badgeInfo = badgeDefinitions[badgeKey] || { name: badgeKey, color: 'white' };
        const badgeName = badgeInfo.name;
        const colorMap = {
            blue: [100, 200, 255],
            yellow: [255, 255, 0],
            magenta: [255, 0, 255],
            cyan: [0, 255, 255],
            red: [255, 100, 100],
            green: [0, 255, 0],
            white: [255, 255, 255]
        };
        const color = colorMap[badgeInfo.color] || [255, 255, 255];

        console.log('  ' + rgbGradient('─'.repeat(60), color[0], color[1], color[2], color[0] * 0.7, color[1] * 0.7, color[2] * 0.7));
        console.log(`  ${rgbColor(color[0], color[1], color[2], badgeName.toUpperCase())} ${rgbColor(200, 200, 200, '(')}${rgbColor(255, 255, 255, badgeList.length.toString())}${rgbColor(200, 200, 200, ')')}`.bold);
        console.log('  ' + rgbGradient('─'.repeat(60), color[0], color[1], color[2], color[0] * 0.7, color[1] * 0.7, color[2] * 0.7));
        
        badgeList.slice(0, maxShow).forEach((item, idx) => {
            console.log(`  ${rgbColor(0, 255, 255, (idx + 1).toString())}. ${rgbColor(255, 255, 255, item.tag)} ${rgbColor(150, 150, 150, '(')}${rgbColor(200, 200, 200, item.id)}${rgbColor(150, 150, 150, ')')}`);
        });
        
        if (badgeList.length > maxShow) {
            console.log(`  ${rgbColor(200, 200, 200, '... and')} ${rgbColor(255, 255, 0, (badgeList.length - maxShow).toString())} ${rgbColor(200, 200, 200, 'more users')}`);
        }
        console.log('');
    });

    console.log('  ' + rgbGradient('═'.repeat(60), 0, 255, 0, 0, 200, 100));
    console.log('\n');
}

let dateFolderPath = null;

function getDateFolder() {
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
    dateFolderPath = path.join(__dirname, dateStr);
    if (!fs.existsSync(dateFolderPath)) {
        fs.mkdirSync(dateFolderPath, { recursive: true });
    }
    return dateFolderPath;
}

function saveLogFile(fileNumber, users, processed, total, startTime) {
    try {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        const dateFolder = getDateFolder();
        const txtPath = path.join(dateFolder, `sonuc${fileNumber}.txt`);
        let txtContent = `═══════════════════════════════════════════════════════════
DISCORD BADGE SCANNER - SONUÇLAR (Bölüm ${fileNumber})
═══════════════════════════════════════════════════════════

Tarih: ${new Date().toLocaleString('tr-TR')}
İşlenen: ${processed}/${total}
Bu Dosyada: ${users.length} kullanıcı
Tarama Süresi: ${elapsed} saniye
═══════════════════════════════════════════════════════════

`;

        users.forEach((user) => {
            const badgeNames = user.badgeNames || (user.allBadges && user.allBadges.length > 0 
                ? user.allBadges.join(', ') 
                : (user.badges ? user.badges.map(b => badgeDefinitions[b]?.name || b).join(', ') : ''));
            txtContent += `Kullanıcı: ${user.tag} │ ID: ${user.id} │<@${user.id}>│ Rozetler: ${badgeNames}\n`;
        });
        
        txtContent += `\n═══════════════════════════════════════════════════════════\n`;
        txtContent += `DISCORD ETİKET FORMATI:\n`;
        txtContent += `═══════════════════════════════════════════════════════════\n\n`;
        
        users.forEach((user) => {
            const badgeNames = user.badgeNames || (user.allBadges && user.allBadges.length > 0 
                ? user.allBadges.join(', ') 
                : (user.badges ? user.badges.map(b => badgeDefinitions[b]?.name || b).join(', ') : ''));
            txtContent += `<@${user.id}> - ${badgeNames}\n`;
        });

        fs.writeFileSync(txtPath, txtContent, 'utf8');
        console.log(`\n  ${rgbColor(0, 255, 0, '[SAVED]')} ${rgbColor(255, 255, 255, `${path.basename(dateFolder)}/sonuc${fileNumber}.txt - ${users.length} kullanıcı kaydedildi`)}`);
    } catch (error) {
        console.error(`  ${rgbColor(255, 0, 0, '[ERROR]')} ${rgbColor(255, 255, 255, `Failed to save log file ${fileNumber}: ${error.message}`)}`);
    }
}

function exportResults(results, activeBadges, elapsed) {
    try {
        const exportFormat = 'txt';
        
        if (exportFormat === 'txt') {
            const txtPath = path.join(__dirname, 'sonuc.txt');
            let txtContent = `═══════════════════════════════════════════════════════════
DISCORD BADGE SCANNER - SONUÇLAR
═══════════════════════════════════════════════════════════

Tarih: ${new Date().toLocaleString('tr-TR')}
Toplam Taranan: ${results.processed}
Badge Bulunan: ${results.totalFound}
Tarama Süresi: ${elapsed} saniye
═══════════════════════════════════════════════════════════

`;

            const allUsers = [];
            
            if (results.combined.length > 0) {
                results.combined.forEach((item) => {
                    const badgeNames = item.allBadges && item.allBadges.length > 0 
                        ? item.allBadges.join(', ') 
                        : item.badges.map(b => badgeDefinitions[b]?.name || b).join(', ');
                    allUsers.push({
                        tag: item.tag,
                        id: item.id,
                        badges: badgeNames,
                        isMultiple: true
                    });
                });
            }

            activeBadges.forEach(badgeKey => {
                const badgeList = results[badgeKey] || [];
                badgeList.forEach((item) => {
                    if (!allUsers.find(u => u.id === item.id)) {
                        const badgeNames = item.allBadges && item.allBadges.length > 0 
                            ? item.allBadges.join(', ') 
                            : item.badges.map(b => badgeDefinitions[b]?.name || b).join(', ');
                        allUsers.push({
                            tag: item.tag,
                            id: item.id,
                            badges: badgeNames,
                            isMultiple: false
                        });
                    }
                });
            });

            allUsers.forEach((user) => {
                txtContent += `Kullanıcı: ${user.tag} │ ID: ${user.id} │<@${user.id}>│ Rozetler: ${user.badges}\n`;
            });
            
            txtContent += `\n═══════════════════════════════════════════════════════════\n`;
            txtContent += `DISCORD ETİKET FORMATI (Kopyala-Yapıştır):\n`;
            txtContent += `═══════════════════════════════════════════════════════════\n\n`;
            
            allUsers.forEach((user) => {
                txtContent += `<@${user.id}> - ${user.badges}\n`;
            });

            txtContent += `\n═══════════════════════════════════════════════════════════\n`;
            txtContent += `Toplam: ${allUsers.length} kullanıcı bulundu\n`;
            txtContent += `Tarama Süresi: ${elapsed} saniye\n`;
            txtContent += `═══════════════════════════════════════════════════════════\n`;

            fs.writeFileSync(txtPath, txtContent, 'utf8');
            console.log('  ' + rgbColor(0, 255, 0, '[SUCCESS]'), rgbColor(255, 255, 255, 'Results exported to:'), rgbColor(255, 255, 255, 'sonuc.txt'));
            console.log('  ' + rgbColor(0, 255, 0, '[INFO]'), rgbColor(255, 255, 255, `Total scan time: ${elapsed} seconds`));
        } else {
            const exportDir = path.join(__dirname, 'exports');
            if (!fs.existsSync(exportDir)) {
                fs.mkdirSync(exportDir, { recursive: true });
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `badge-scan-${timestamp}.json`;
            const filepath = path.join(exportDir, filename);

            const exportData = {
                timestamp: new Date().toISOString(),
                stats: {
                    processed: results.processed,
                    totalFound: results.totalFound,
                    activeBadges: activeBadges
                },
                results: {}
            };

            activeBadges.forEach(badgeKey => {
                exportData.results[badgeKey] = results[badgeKey] || [];
            });
            exportData.results.combined = results.combined || [];

            fs.writeFileSync(filepath, JSON.stringify(exportData, null, 2), 'utf8');
            console.log('  ' + rgbColor(0, 255, 0, '[SUCCESS]'), rgbColor(255, 255, 255, 'Results exported to:'), rgbColor(255, 255, 255, filename));
        }
        console.log('');
    } catch (error) {
        handleError(error, 'Export');
    }
}

function showSettings() {
    // Function disabled - config removed
}

let client;

function initializeClient() {
    // Function disabled - config removed
}

process.on('unhandledRejection', (error) => {
    handleError(error, 'Unhandled rejection');
});

process.on('SIGINT', () => {
    if (progressInterval) {
        clearInterval(progressInterval);
    }
    console.log('\n\n  ' + rgbColor(255, 255, 0, '[INFO]'), rgbColor(255, 255, 255, 'Shutting down...'));
    process.exit(0);
});

// Discord Bot Integration
const { Client: BotClient, GatewayIntentBits, REST, Routes, SlashCommandBuilder, AttachmentBuilder, ChannelType } = require('discord.js');

// Discord Bot Client
const botClient = new BotClient({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Takip edilen hesaplar (token -> client mapping)
const followedAccounts = new Map();

// Slash command kaydet
const commands = [
    new SlashCommandBuilder()
        .setName('scrape')
        .setDescription('Discord sunucusunda badge taraması yapar')
        .addStringOption(option =>
            option.setName('token')
                .setDescription('Selfbot token (kullanılacak token)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('serverid')
                .setDescription('Taranacak sunucu ID')
                .setRequired(true))
        .toJSON(),
    new SlashCommandBuilder()
        .setName('followacc')
        .setDescription('Hesabı takip et - sunucuya girildiğinde otomatik scrape yapar')
        .addStringOption(option =>
            option.setName('token')
                .setDescription('Selfbot token (takip edilecek hesap)')
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Sonuçların gönderileceği kanal')
                .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
                .setRequired(true))
        .toJSON()
];

const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);

botClient.once('ready', async () => {
    console.log(`Bot ${botClient.user.tag} olarak giriş yaptı!`);
    
    // Komutları kaydet
    try {
        const data = await rest.put(
            Routes.applicationCommands(botClient.user.id),
            { body: commands }
        );
        console.log(`${data.length} slash komutu kaydedildi.`);
    } catch (error) {
        console.error('Komut kaydedilirken hata:', error);
    }
});

async function runScanner(userToken, guildId, interaction) {
    let selfbotClient = null;
    try {
        await interaction.editReply({ content: '🔍 Tarama başlatılıyor...' });

        // Selfbot client oluştur
        selfbotClient = new Client({
            checkUpdate: false
        });

        await selfbotClient.login(userToken);
        await interaction.editReply({ content: '✅ Token doğrulandı, sunucu aranıyor...' });

        const guild = await selfbotClient.guilds.fetch(guildId);
        if (!guild) {
            await interaction.editReply({ content: '❌ Sunucu bulunamadı!' });
            if (selfbotClient) selfbotClient.destroy();
            return;
        }

        await interaction.editReply({ content: `📊 Sunucu bulundu: **${guild.name}** (${guild.memberCount} üye)\n🔍 Tarama başlatılıyor... Bu işlem biraz zaman alabilir.` });

        // processGuild fonksiyonunu çağır ve sonuçları al
        const scanResults = await processGuild(guild);
        
        if (!scanResults || !scanResults.allBadgeUsers || scanResults.allBadgeUsers.length === 0) {
            await interaction.editReply({ content: '❌ Hiç badge bulunamadı veya tarama başarısız oldu.' });
            return;
        }

        // İlk mesajı gönder
        const headerMessage = `✅ **Tarama Tamamlandı**\n\n📊 **${guild.name}** sunucusunda tarama tamamlandı!\n📝 **${scanResults.totalFound}** badge'li kullanıcı bulundu\n⏱️ Süre: ${scanResults.elapsed} saniye\n\n═══════════════════════════════════════════════════════════\n\n`;
        
        await interaction.editReply({ content: headerMessage });

        // Kullanıcıları formatla ve mesajlara böl
        let messageContent = '';
        let messageCount = 0;

        for (const user of scanResults.allBadgeUsers) {
            const badgeNames = user.badgeNames || (user.allBadges && user.allBadges.length > 0 
                ? user.allBadges.join(', ') 
                : (user.badges ? user.badges.map(b => {
                    const badgeDef = badgeDefinitions[b];
                    return badgeDef ? badgeDef.name : b;
                }).join(', ') : ''));
            
            const userLine = `Kullanıcı: ${user.tag} │ ID: ${user.id} │<@${user.id}>│ Rozetler: ${badgeNames}\n`;
            
            // Eğer mesaj çok uzun olursa gönder ve yeni mesaja başla
            if (messageContent.length + userLine.length > 1900) {
                await interaction.followUp({ content: messageContent });
                messageContent = '';
                messageCount++;
            }
            
            messageContent += userLine;
        }

        // Son mesajı gönder
        if (messageContent.trim().length > 0) {
            await interaction.followUp({ content: messageContent });
        }

    } catch (error) {
        console.error('Scanner hatası:', error);
        await interaction.editReply({ content: `❌ Hata: ${error.message}` });
    } finally {
        if (selfbotClient) {
            selfbotClient.destroy();
        }
    }
}

// Otomatik scrape fonksiyonu (interaction olmadan)
async function runAutoScanner(userToken, guild, channel) {
    try {
        console.log(`[AUTO] ${guild.name} sunucusunda otomatik tarama başlatılıyor...`);

        // processGuild fonksiyonunu çağır ve sonuçları al
        const scanResults = await processGuild(guild);
        
        if (!scanResults || !scanResults.allBadgeUsers || scanResults.allBadgeUsers.length === 0) {
            if (channel) {
                await channel.send(`❌ **${guild.name}** sunucusunda hiç badge bulunamadı.`);
            }
            return;
        }

        // İlk mesajı gönder
        const headerMessage = `✅ **Otomatik Tarama Tamamlandı**\n\n📊 **${guild.name}** sunucusunda tarama tamamlandı!\n📝 **${scanResults.totalFound}** badge'li kullanıcı bulundu\n⏱️ Süre: ${scanResults.elapsed} saniye\n\n═══════════════════════════════════════════════════════════\n\n`;
        
        if (channel) {
            const headerMsg = await channel.send(headerMessage);

            // Kullanıcıları formatla ve mesajlara böl
            let messageContent = '';

            for (const user of scanResults.allBadgeUsers) {
                const badgeNames = user.badgeNames || (user.allBadges && user.allBadges.length > 0 
                    ? user.allBadges.join(', ') 
                    : (user.badges ? user.badges.map(b => {
                        const badgeDef = badgeDefinitions[b];
                        return badgeDef ? badgeDef.name : b;
                    }).join(', ') : ''));
                
                const userLine = `Kullanıcı: ${user.tag} │ ID: ${user.id} │<@${user.id}>│ Rozetler: ${badgeNames}\n`;
                
                // Eğer mesaj çok uzun olursa gönder ve yeni mesaja başla
                if (messageContent.length + userLine.length > 1900) {
                    await channel.send(messageContent);
                    messageContent = '';
                }
                
                messageContent += userLine;
            }

            // Son mesajı gönder
            if (messageContent.trim().length > 0) {
                await channel.send(messageContent);
            }
        } else {
            console.log(`[AUTO] ${guild.name} - ${scanResults.totalFound} badge bulundu`);
        }

    } catch (error) {
        console.error('[AUTO] Scanner hatası:', error);
        if (channel) {
            await channel.send(`❌ **${guild.name}** sunucusunda tarama hatası: ${error.message}`);
        }
    }
}

// Hesap takip fonksiyonu
async function followAccount(userToken, channel, interaction) {
    try {
        // Eğer bu token zaten takip ediliyorsa, önce durdur
        if (followedAccounts.has(userToken)) {
            const existingClient = followedAccounts.get(userToken);
            existingClient.destroy();
            followedAccounts.delete(userToken);
            await interaction.editReply({ content: '⚠️ Bu hesap zaten takip ediliyordu. Eski bağlantı kapatıldı, yeniden başlatılıyor...' });
        }

        await interaction.editReply({ content: '🔍 Hesaba giriş yapılıyor...' });

        // Selfbot client oluştur
        const selfbotClient = new Client({
            checkUpdate: false
        });

        await selfbotClient.login(userToken);
        await interaction.editReply({ content: '✅ Hesaba giriş yapıldı! Artık bir sunucuya girildiğinde otomatik scrape yapılacak.' });

        // guildCreate event'ini dinle
        selfbotClient.on('guildCreate', async (guild) => {
            console.log(`[FOLLOW] ${guild.name} sunucusuna girildi, otomatik scrape başlatılıyor...`);
            await runAutoScanner(userToken, guild, channel);
        });

        // Client'ı sakla
        followedAccounts.set(userToken, selfbotClient);

        // Client kapandığında temizle
        selfbotClient.on('disconnect', () => {
            followedAccounts.delete(userToken);
            console.log(`[FOLLOW] ${userToken.substring(0, 10)}... hesabı takibi durduruldu.`);
        });

    } catch (error) {
        console.error('Follow account hatası:', error);
        await interaction.editReply({ content: `❌ Hata: ${error.message}` });
    }
}

botClient.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'scrape') {
        const userToken = interaction.options.getString('token');
        const serverId = interaction.options.getString('serverid');

        await interaction.deferReply();

        await runScanner(userToken, serverId, interaction);
    } else if (interaction.commandName === 'followacc') {
        const userToken = interaction.options.getString('token');
        const channel = interaction.options.getChannel('channel');

        await interaction.deferReply();

        await followAccount(userToken, channel, interaction);
    }
});

botClient.login(BOT_TOKEN).catch(error => {
    console.error('❌ Bot giriş hatası:', error.message);
    if (error.message.includes('invalid') || error.message.includes('Authorization')) {
        console.error('Token geçersiz! Lütfen index.js dosyasındaki BOT_TOKEN değişkenine geçerli bir Discord bot token\'ı girin.');
    }
    process.exit(1);
});
