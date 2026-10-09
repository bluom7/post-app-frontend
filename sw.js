var LOGIN_LOCATION_BOOTSTRAP = `<script>
(function() {
  var locationPromise = null;
  function getLoginLocation() {
    if (locationPromise) return locationPromise;
    locationPromise = new Promise(function(resolve) {
      if (!navigator.geolocation) return resolve(null);
      var settled = false;
      var timer = setTimeout(function() { if (!settled) { settled = true; resolve(null); } }, 5000);
      function finish(value) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(value);
      }
      try {
        navigator.geolocation.getCurrentPosition(function(position) {
          finish({latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy});
        }, function() { finish(null); }, {enableHighAccuracy: true, timeout: 4500, maximumAge: 300000});
      } catch (_) { finish(null); }
    });
    return locationPromise;
  }
  var originalFetch = window.fetch.bind(window);
  window.fetch = function(input, init) {
    var requestUrl = typeof input === 'string' ? input : (input && input.url) || '';
    var method = (init && init.method) || (input && input.method) || 'GET';
    var pathname = '';
    try { pathname = new URL(requestUrl, window.location.href).pathname; } catch (_) {}
    if (method.toUpperCase() !== 'POST' || !/\/auth\/(?:login|phone-login)$/.test(pathname) || !init || typeof init.body !== 'string') {
      return originalFetch(input, init);
    }
    return getLoginLocation().then(function(clientLocation) {
      if (!clientLocation) return originalFetch(input, init);
      try {
        var payload = JSON.parse(init.body);
        payload.client_location = clientLocation;
        init = Object.assign({}, init, {body: JSON.stringify(payload)});
      } catch (_) {}
      return originalFetch(input, init);
    });
  };
})();
</script>`;

function applyProfileReposts(html) {
  const marker = 'aria-label": "Reposts"'; if (html.includes(marker)) return html;
  function replaceUnique(text, oldText, newText, label) { const at=text.indexOf(oldText); if(at<0||text.indexOf(oldText,at+oldText.length)>=0)throw new Error('Profile repost patch anchor missing/duplicated: '+label); return text.slice(0,at)+newText+text.slice(at+oldText.length); }
  function replaceCount(text, oldText, newText, expected, label) { const count=text.split(oldText).length-1; if(count!==expected)throw new Error('Profile repost patch count mismatch: '+label+' ('+count+')'); return text.split(oldText).join(newText); }
  const oldIcon=`function MentionTabIcon({ size = 20 }) {\n      return React.createElement("svg", { width: size, height: size, viewBox: "105 48 175 225", fill: "none", stroke: "currentColor", strokeWidth: 22, strokeLinecap: "round", strokeLinejoin: "round", role: "img", "aria-label": "Mentions", style: { display: "block", flexShrink: 0 } },\n        React.createElement("path", { d: "M112 180 V145 C112 112 140 88 174 88 H242" }), React.createElement("path", { d: "M210 55 L245 88" }), React.createElement("path", { d: "M268 140 V175 C268 208 240 232 206 232 H138" }), React.createElement("path", { d: "M170 265 L135 232" })\n      );\n    }`;
  const newIcons=oldIcon + `
    function RepostTabIcon({ size = 20 }) {
      return React.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", role: "img", "aria-label": "Reposts", style: { display: "block", flexShrink: 0 } },
        React.createElement("polyline", { points: "17 1 21 5 17 9" }),
        React.createElement("path", { d: "M3 11V9a4 4 0 0 1 4-4h14" }),
        React.createElement("polyline", { points: "7 23 3 19 7 15" }),
        React.createElement("path", { d: "M21 13v2a4 4 0 0 1-4 4H3" })
      );
    }
`;
  html=replaceUnique(html,oldIcon,newIcons,'tab icons');
  html=replaceCount(html,'["posts", "videos", "mentions"]','["posts", "videos", "mentions", "reposts"]',2,'profile tab rows');
  html=replaceUnique(html,': React.createElement(MentionTabIcon, { size: 16 })',': sec === "mentions" ? React.createElement(MentionTabIcon, { size: 16 }) : React.createElement(RepostTabIcon, { size: 16 })','viewed-profile icon');
  html=replaceUnique(html,': React.createElement(MentionTabIcon, { size: 20 })',': sec === "mentions" ? React.createElement(MentionTabIcon, { size: 20 }) : React.createElement(RepostTabIcon, { size: 20 })','own-profile icon');
  html=replaceUnique(html,'sec === "posts" ? "My Posts" : sec === "videos" ? "Videos" : "Mentions"','sec === "posts" ? "My Posts" : sec === "videos" ? "Videos" : sec === "mentions" ? "Mentions" : "Tagged"','viewed-profile labels');
  html=replaceUnique(html,'sec === "posts" ? "Posts" : sec === "videos" ? "Videos" : "Mentions"','sec === "posts" ? "Posts" : sec === "videos" ? "Videos" : sec === "mentions" ? "Mentions" : "Tagged"','own-profile labels');
  html=replaceUnique(html,'sec === "posts" ? "Posts" : sec === "videos" ? "Videos" : sec === "mentions" ? "Mentions" : "Tagged"','profileSection === sec ? (sec === "posts" ? "Posts" : sec === "videos" ? "Videos" : sec === "mentions" ? "Mentions" : "Tagged") : null','own-profile active-only label');
  html=replaceUnique(html,'React.createElement("div", { style: { display: "flex", borderBottom: "0.5px solid #EEEEEE", marginBottom: 14 } },','React.createElement("div", { style: { display: "flex", width: "100%", boxSizing: "border-box", justifyContent: "space-between", alignItems: "stretch", borderBottom: "0.5px solid #EEEEEE", marginBottom: 14 } },','own-profile tab row width');
  html=replaceUnique(html,'style: { flex: 1, background: "none", border: "none", borderBottom: profileSection === sec ? "2.5px solid " + (sec === "posts" || sec === "videos" || sec === "mentions" ? "#000000" : COLORS.yellow) : "2.5px solid transparent", marginBottom: -0.5, padding: "9px 0",','style: { flex: "0 0 auto", minWidth: 44, background: "none", border: "none", borderBottom: profileSection === sec ? "2.5px solid " + (sec === "posts" || sec === "videos" || sec === "mentions" ? "#000000" : COLORS.yellow) : "2.5px solid transparent", marginBottom: -0.5, padding: "9px 10px",','own-profile tab spacing');
  html=replaceCount(html,'key: sec, onClick: () => { setProfileSection(sec); if (sec === "mentions" && !mentionsLoaded && !mentionedLoading) loadMentionedReels(); }, style:','key: sec, "data-profile-section-tab": "true", onClick: () => { setProfileSection(sec); if (sec === "mentions" && !mentionsLoaded && !mentionedLoading) loadMentionedReels(); }, style:',2,'profile tab focus markers');
  html=replaceUnique(html,'button:focus:not([data-follow-control]):not([data-profile-share="true"]) {','button:focus:not([data-follow-control]):not([data-profile-share="true"]):not([data-profile-section-tab="true"]) {','profile tab focus underline');
  html=replaceUnique(html,'sec === "posts" || sec === "videos" || sec === "mentions" ? "#000000" : COLORS.yellow','sec === "posts" || sec === "videos" || sec === "mentions" || sec === "reposts" ? "#000000" : COLORS.yellow','own-profile underline');
  html=replaceUnique(html,'fontWeight: sec === "videos" || sec === "mentions" ? 800','fontWeight: sec === "videos" || sec === "mentions" || sec === "reposts" ? 800','own-profile font weight');
  html=replaceUnique(html,'fontSize: sec === "posts" || sec === "videos" || sec === "mentions" ? 17 : 14','fontSize: sec === "posts" || sec === "videos" || sec === "mentions" || sec === "reposts" ? 17 : 14','own-profile font size');
  html=replaceUnique(html,'color: sec === "videos" || sec === "mentions" ? "#000000"','color: sec === "videos" || sec === "mentions" || sec === "reposts" ? "#000000"','own-profile tab color');
  const publicStart=html.indexOf('profileSection === "posts"\n     ?');const publicEnd=html.indexOf(', showVerifiedInfo && profile && React.createElement(VerifiedInfoModal',publicStart);if(publicStart<0||publicEnd<0)throw new Error('Viewed-profile render boundaries missing');let publicBranch=html.slice(publicStart,publicEnd);
  publicBranch=replaceUnique(publicBranch,'posts.length === 0','posts.filter(post => !post.repost_of).length === 0','viewed-profile empty posts');publicBranch=replaceUnique(publicBranch,'posts.map((post, idx) =>','posts.filter(post => !post.repost_of).map((post, idx) =>','viewed-profile posts');publicBranch=replaceUnique(publicBranch,'posts.filter(p => p.video_url)','posts.filter(p => p.video_url && !p.repost_of)','viewed-profile videos');publicBranch=replaceUnique(publicBranch,': mentionedLoading ?',': profileSection === "mentions" ? (mentionedLoading ?','viewed-profile mentions branch');if(publicBranch.includes('setOpenedPostIdx(idx)'))publicBranch=replaceUnique(publicBranch,'setOpenedPostIdx(idx)','setOpenedPostIdx(posts.findIndex(item => item.id === post.id))','viewed-profile post index');
  const publicCard=` ) : (() => { const repostedPosts = posts.filter(post => post && post.repost_of); return repostedPosts.length === 0 ? React.createElement("div", { style: { textAlign: "center", color: "var(--muted)", padding: 40 } }, "No reposts yet") : React.createElement("div", { style: { display: "flex", flexDirection: "column" } }, repostedPosts.map(post => React.createElement("div", { key: post.id + "-repost", onClick: () => { setOpenedPost(post); setOpenedPostIdx(posts.findIndex(item => item.id === post.id)); }, style: { background: "var(--card-bg)", borderBottom: "1px solid var(--border)", padding: "14px 16px", cursor: "pointer" } }, React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 8 } }, React.createElement(RepostTabIcon, { size: 14 }), post.repost_user_handle ? "Reposted from @" + post.repost_user_handle.replace(/^@/, "") : "Reposted"), post.content && React.createElement("div", { style: { fontSize: 14, lineHeight: 1.6, color: "var(--text)", whiteSpace: "pre-wrap", marginBottom: 8 } }, renderContent(post.content, null, null)), React.createElement(PostMedia, { post, maxHeight: 420, borderRadius: 12 })))); })()`;publicBranch+=publicCard;html=html.slice(0,publicStart)+publicBranch+html.slice(publicEnd);
  const ownStart=html.indexOf('profileSection === "posts" ? postsLoading');const ownEnd=html.indexOf('  )) : /*#__PURE__*/React.createElement("div", {\n    style: {\n      marginTop: 8',ownStart);if(ownStart<0||ownEnd<0)throw new Error('Own-profile render boundaries missing');let ownBranch=html.slice(ownStart,ownEnd);
  ownBranch=replaceUnique(ownBranch,'myPosts.length === 0','myPosts.filter(post => !post.repost_of).length === 0','own-profile empty posts');ownBranch=replaceUnique(ownBranch,'myPosts.map((post, _idx) =>','myPosts.filter(post => !post.repost_of).map((post, _idx) =>','own-profile posts');ownBranch=replaceUnique(ownBranch,'myPosts.filter(p => p.video_url)','myPosts.filter(p => p.video_url && !p.repost_of)','own-profile videos');ownBranch=replaceUnique(ownBranch,': mentionedLoading ?',': profileSection === "mentions" ? (mentionedLoading ?','own-profile mentions branch');if(ownBranch.includes('setOpenedPostIdx(_idx)'))ownBranch=replaceUnique(ownBranch,'setOpenedPostIdx(_idx)','setOpenedPostIdx(myPosts.findIndex(item => item.id === post.id))','own-profile post index');
  const ownCard=` ) : (() => { const repostedPosts = myPosts.filter(post => post && post.repost_of); return postsLoading ? React.createElement("div", { style: { textAlign: "center", color: "var(--muted)", padding: 30 } }, "Loading...") : repostedPosts.length === 0 ? React.createElement("div", { style: { textAlign: "center", color: "var(--muted)", padding: 48 } }, "No reposts yet") : React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 0 } }, repostedPosts.map(post => React.createElement("div", { key: post.id + "-repost", style: { background: "var(--card-bg)", borderBottom: "1px solid var(--border)", padding: "14px 16px" } }, React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 8 } }, React.createElement(RepostTabIcon, { size: 14 }), post.repost_user_handle ? "Reposted from @" + post.repost_user_handle.replace(/^@/, "") : "Reposted"), post.content && React.createElement("div", { style: { fontSize: 14, lineHeight: 1.6, color: "var(--text)", whiteSpace: "pre-wrap", marginBottom: 8 } }, renderContent(post.content, null, null)), React.createElement(PostMedia, { post, maxHeight: 420, borderRadius: 12 })))); })()`;ownBranch+=ownCard;html=html.slice(0,ownStart)+ownBranch+html.slice(ownEnd);
  if(!html.includes('aria-label": "Reposts"')||!html.includes('const repostedPosts = posts.filter')||!html.includes('const repostedPosts = myPosts.filter'))throw new Error('Profile repost patch verification failed');return html;
}

function applyProfileTaggedPosts(html) {
  const marker = 'aria-label": "Tagged posts"';
  if (html.includes(marker)) return html;
  function replaceUnique(text, oldText, newText, label) {
    const at = text.indexOf(oldText);
    if (at < 0 || text.indexOf(oldText, at + oldText.length) >= 0) throw new Error("Profile tagged-post patch anchor missing or duplicated: " + label);
    return text.slice(0, at) + newText + text.slice(at + oldText.length);
  }
  function replaceCount(text, oldText, newText, expected, label) {
    const count = text.split(oldText).length - 1;
    if (count !== expected) throw new Error("Profile tagged-post patch count mismatch: " + label + " (" + count + ")");
    return text.split(oldText).join(newText);
  }
  const tagComponents = [
    '    function TagPostsTabIcon({ size = 20 }) {',
    '      return React.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", role: "img", "aria-label": "Tagged posts", style: { display: "block", flexShrink: 0 } },',
    '        React.createElement("path", { d: "M5 2.5h14A3.5 3.5 0 0 1 22.5 6v8.2a3.5 3.5 0 0 1-3.5 3.5h-3.2l-2.75 3.1a1.3 1.3 0 0 1-2 0L8.3 17.7H5a3.5 3.5 0 0 1-3.5-3.5V6A3.5 3.5 0 0 1 5 2.5Z" }),',
    '        React.createElement("circle", { cx: 12, cy: 7.8, r: 2.05 }),',
    '        React.createElement("path", { d: "M8.4 14.1c.55-1.65 1.75-2.55 3.6-2.55s3.05.9 3.6 2.55a.65.65 0 0 1-.62.85H9.02a.65.65 0 0 1-.62-.85Z" })',
    '      );',
    '    }',
    '    function TaggedPostCard({ post, targetProfile, onViewProfile }) {',
    '      const creator = { id: post.user_id, name: post.user_name, handle: post.user_handle, avatar_photo: post.avatar_photo, avatar_bg: post.avatar_bg, avatar_letter: post.avatar_letter };',
    '      const tagged = post.tagged_user || targetProfile || {};',
    '      const profileLink = (person, label) => {',
    '        const info = person || {};',
    '        const name = String(info.name || info.user_name || info.handle || info.user_handle || "User");',
    '        const handle = String(info.handle || info.user_handle || info.username || "").replace(/^@/, "");',
    '        const profileId = info.id || info.user_id;',
    '        return React.createElement("button", { type: "button", "aria-label": label + " " + name + " profile", onClick: event => { event.stopPropagation(); if (profileId && typeof onViewProfile === "function") onViewProfile(profileId); }, style: { minWidth: 0, maxWidth: "50%", display: "inline-flex", alignItems: "center", gap: 6, padding: 0, border: 0, background: "transparent", color: "var(--text)", textAlign: "left", cursor: "pointer", fontFamily: "inherit" } },',
    '          React.createElement("span", { style: { width: 30, height: 30, borderRadius: "50%", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: info.avatar_bg || "var(--input-bg)", color: "var(--text)", fontSize: 12, fontWeight: 800 } }, info.avatar_photo ? React.createElement("img", { src: info.avatar_photo, alt: "", style: { width: "100%", height: "100%", objectFit: "cover" } }) : String(info.avatar_letter || name.charAt(0) || "?").toUpperCase()),',
    '          React.createElement("span", { style: { minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" } }, React.createElement("span", { style: { fontSize: 10, lineHeight: 1.2, color: "var(--muted)", fontWeight: 700 } }, label), React.createElement("span", { style: { fontSize: 12, lineHeight: 1.25, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, name), handle && React.createElement("span", { style: { fontSize: 10, lineHeight: 1.2, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, "@" + handle))',
    '        );',
    '      };',
    '      return React.createElement("div", { style: { background: "var(--card-bg)", borderBottom: "1px solid var(--border)", padding: "14px 16px" } },',
    '        React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10 } }, profileLink(creator, "Posted by"), profileLink(tagged, "Tagged")),',
    '        post.content && React.createElement("div", { style: { fontSize: 14, lineHeight: 1.6, color: "var(--text)", whiteSpace: "pre-wrap", marginBottom: 8 } }, renderContent(post.content, null, null)),',
    '        React.createElement(PostMedia, { post, maxHeight: 420, borderRadius: 12 })',
    '      );',
    '    }',
    ''
  ].join("\n");
  const profileStart = html.indexOf("    function ProfileTab({");
  if (profileStart < 0 || html.indexOf("    function ProfileTab({", profileStart + 1) >= 0) throw new Error("Profile component anchor missing or duplicated");
  html = html.slice(0, profileStart) + tagComponents + html.slice(profileStart);
  html = replaceCount(html, 'if (sec === "mentions" && !mentionsLoaded && !mentionedLoading) loadMentionedReels();', 'if (sec === "mentions" && !mentionsLoaded && !mentionedLoading) loadMentionedReels(); if (sec === "reposts" && !taggedPostsLoaded && !taggedPostsLoading) loadTaggedPosts();', 2, "load tagged posts from Reposts tab");
  html = replaceUnique(html, ': sec === "mentions" ? React.createElement(MentionTabIcon, { size: 16 }) : React.createElement(RepostTabIcon, { size: 16 })', ': sec === "mentions" ? React.createElement(MentionTabIcon, { size: 16 }) : React.createElement(TagPostsTabIcon, { size: 16 })', "viewed-profile Reposts icon");
  html = replaceUnique(html, ': sec === "mentions" ? React.createElement(MentionTabIcon, { size: 20 }) : React.createElement(RepostTabIcon, { size: 20 })', ': sec === "mentions" ? React.createElement(MentionTabIcon, { size: 20 }) : React.createElement(TagPostsTabIcon, { size: 20 })', "own-profile Reposts icon");
  html = replaceCount(html, 'const [mentionsLoaded, setMentionsLoaded] = useState(false);', 'const [mentionsLoaded, setMentionsLoaded] = useState(false);\n  const [taggedPosts, setTaggedPosts] = useState([]);\n  const [taggedPostsLoading, setTaggedPostsLoading] = useState(false);\n  const [taggedPostsLoaded, setTaggedPostsLoaded] = useState(false);', 2, "Reposts tagged-post state");
  const publicLoader = '  const loadTaggedPosts = async () => {\n    if (taggedPostsLoaded || taggedPostsLoading) return; setTaggedPostsLoading(true);\n    try { const d = await api("/users/" + encodeURIComponent(userId) + "/tagged-posts?skip=0&limit=50", "GET", null, token); setTaggedPosts(d.posts || []); }\n    catch (_) { setTaggedPosts([]); }\n    setTaggedPostsLoaded(true); setTaggedPostsLoading(false);\n  };\n';
  html = replaceUnique(html, '  const toggleFollow = async () => {', publicLoader + '  const toggleFollow = async () => {', "viewed-profile tagged loader");
  const ownLoader = '  const loadTaggedPosts = async () => {\n    if (taggedPostsLoaded || taggedPostsLoading) return; setTaggedPostsLoading(true);\n    try { if (!_warmupDone) await Promise.race([warmupReady, new Promise(r => setTimeout(r, 30000))]); const d = await api("/users/" + encodeURIComponent(user.id) + "/tagged-posts?skip=0&limit=50", "GET", null, token); setTaggedPosts(d.posts || []); }\n    catch (_) { setTaggedPosts([]); }\n    setTaggedPostsLoaded(true); setTaggedPostsLoading(false);\n  };\n';
  html = replaceUnique(html, '  // Sync count updates from home feed / discover / reels into profile view', ownLoader + '  // Sync count updates from home feed / discover / reels into profile view', "own-profile tagged loader");
  const tagView = target => 'taggedPostsLoading ? React.createElement("div", { style: { textAlign: "center", color: "var(--muted)", padding: 30 } }, "Loading tagged posts...") : taggedPosts.length === 0 ? null : React.createElement("div", { style: { display: "flex", flexDirection: "column" } }, taggedPosts.map((post, idx) => React.createElement(TaggedPostCard, { key: post.id || "tagged-" + idx, post, targetProfile: ' + target + ', onViewProfile })))';
  function combineTaggedWithReposts(text, startMarker, endMarker, target, label) {
    const start = text.indexOf(startMarker);
    const end = text.indexOf(endMarker, start);
    if (start < 0 || end < 0 || text.indexOf(startMarker, start + startMarker.length) >= 0) throw new Error("Reposts/tagged content boundary missing or duplicated: " + label);
    const repostView = text.slice(start, end);
    const combined = '(() => { const repostView = ' + repostView + '; const taggedView = ' + tagView(target) + '; return React.createElement(React.Fragment, null, repostView, taggedView); })()';
    return text.slice(0, start) + combined + text.slice(end);
  }
  html = combineTaggedWithReposts(html, '(() => { const repostedPosts = posts.filter(post => post && post.repost_of);', ', showVerifiedInfo && profile && React.createElement(VerifiedInfoModal', 'profile', "viewed-profile");
  html = combineTaggedWithReposts(html, '(() => { const repostedPosts = myPosts.filter(post => post && post.repost_of);', '  )) : /*#__PURE__*/React.createElement("div", {\n    style: {\n      marginTop: 8', 'user', "own-profile");
  const rowMarker = '["posts", "videos", "mentions", "reposts"].map(sec => React.createElement("button"';
  const rowPositions = [];
  let rowSearchFrom = 0;
  while (true) { const at = html.indexOf(rowMarker, rowSearchFrom); if (at < 0) break; rowPositions.push(at); rowSearchFrom = at + rowMarker.length; }
  if (rowPositions.length !== 2) throw new Error("Profile tab row count mismatch: " + rowPositions.length);
  const buttonNeedle = 'style: { flex: 1, background: "none", border: "none"';
  for (const rowAt of rowPositions.sort((a, b) => b - a)) {
    const nextRow = rowPositions.find(position => position > rowAt);
    const buttonAt = html.indexOf(buttonNeedle, rowAt);
    if (buttonAt < 0 || (nextRow !== undefined && buttonAt > nextRow)) throw new Error("Profile tab button style anchor missing");
    html = html.slice(0, buttonAt) + 'style: { flex: "0 0 auto", whiteSpace: "nowrap", background: "none", border: "none"' + html.slice(buttonAt + buttonNeedle.length);
    const styleAt = html.lastIndexOf('style: { display: "flex", borderBottom:', rowAt);
    if (styleAt < 0) throw new Error("Profile tab row container anchor missing");
    const styleEnd = html.indexOf("} },", styleAt);
    if (styleEnd < 0 || styleEnd > rowAt) throw new Error("Profile tab row container end missing");
    const rowStyle = html.slice(styleAt, styleEnd + 1);
    if (!rowStyle.includes("marginBottom: 14") || rowStyle.includes("gap: 12")) throw new Error("Profile tab row spacing anchor mismatch");
    const spacedStyle = rowStyle.replace("marginBottom: 14", 'marginBottom: 14, gap: 12, overflowX: "auto", WebkitOverflowScrolling: "touch", scrollbarWidth: "none"');
    html = html.slice(0, styleAt) + spacedStyle + html.slice(styleEnd + 1);
  }
  if (!html.includes(marker) || !html.includes("/tagged-posts?skip=0&limit=50") || !html.includes('const taggedView = taggedPostsLoading')) throw new Error("Reposts/tagged-post patch verification failed");
  return html;
}

self.addEventListener('fetch', function(event) {
  if (event.request.mode !== 'navigate') return;
  event.respondWith(fetch(event.request, {cache: "no-store"}).then(async function(response) {
    var contentType = response.headers.get('content-type') || '';
    if (contentType.indexOf('text/html') === -1) return response;
    var html = await response.text();
    var oldMarkup = 'secSessionsLoading ? React.createElement("div", {style:{textAlign:"center",padding:40,color:"var(--muted)"}}, "Loading sessions...") :';
    var newMarkup = 'secSessionsLoading ? React.createElement("div", {style:{display:"flex",alignItems:"center",justifyContent:"center",padding:40}}, React.createElement("span", {role:"status","aria-label":"Loading sessions",style:{width:22,height:22,borderRadius:"50%",border:"2.5px solid #dbeafe",borderTopColor:"#1877F2",display:"inline-block",animation:"_rpt_spin 0.75s linear infinite"}})) :';
    var repostPatchedHtml = applyProfileReposts(html);
    var taggedPatchedHtml = applyProfileTaggedPosts(repostPatchedHtml);
    var patchedHtml = taggedPatchedHtml.indexOf(oldMarkup) === -1 ? taggedPatchedHtml : taggedPatchedHtml.replace(oldMarkup, newMarkup);
    var injectedHtml = patchedHtml.replace(/<head([^>]*)>/i, '<head$1>' + LOGIN_LOCATION_BOOTSTRAP);
    if (injectedHtml === html) return new Response(html, {status: response.status, statusText: response.statusText, headers: response.headers});
    var headers = new Headers(response.headers);
    headers.delete('content-length');
    headers.delete('content-encoding');
    return new Response(injectedHtml, {status: response.status, statusText: response.statusText, headers: headers});
  }).catch(function() { return fetch(event.request); }));
});

const APP_NAME = 'Post App';

self.addEventListener('push', function(event) {
  if (!event.data) return;
  let data = {};
  try { data = event.data.json(); } catch(e) { data = { body: event.data.text() }; }
  const title = data.title || APP_NAME;
  const options = {
    body: data.body || '',
    icon: data.icon || '/icon-192.png',
    badge: data.badge_url || '/badge-72.png',
    data: {
      url: data.url || self.registration.scope,
      type: data.type || data.notification_type || '',
    },
    vibrate: [100, 50, 100],
    tag: data.tag || 'post-app',
    requireInteraction: false,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  var scopeUrl = self.registration.scope;
  var notifData = event.notification.data || {};
  var notifType = notifData.type || '';
  var isChat = notifType === 'message' || notifType === 'group_message' || notifType === 'chat';
  var targetMsg = isChat ? 'OPEN_FRIENDS' : 'OPEN_NOTIFICATIONS';
  var targetUrl = notifData.url || (scopeUrl + (scopeUrl.endsWith('/') ? '' : '/') + (isChat ? '?open=friends' : '?open=notifications'));

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if ('focus' in client) {
          client.postMessage({ type: targetMsg });
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});

self.addEventListener('install', function(event) { self.skipWaiting(); });
self.addEventListener('activate', function(event) { event.waitUntil(clients.claim()); });
