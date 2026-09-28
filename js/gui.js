var GUI_SCRIPT_VERSION = "v1.13.0-202609280906";
var DEFAULT_SEARCH_SECONDS = 1;
var AUTO_MOVE_PAUSE_MS = 1000;
var PLAYER_FEEDBACK_DELAY_MS = 20;
var SEARCH_START_DELAY_MS = 160;
var COMPACT_PANEL_WIDTH = 480;
var NARROW_PANEL_WIDTH = 360;
var ARROW_LINE_RATIO = 0.06;
var ARROW_OUTLINE_RATIO = 0.04;
var ARROW_HEAD_RATIO = 0.22;
var ARROW_TIP_OFFSET = 0.34;
var LAYOUT_TOP_SPACE = 48;
var LAYOUT_EDGE_SPACE = 8;
var LAYOUT_PANEL_SPACE = 200;
var MAX_SQUARE_SIZE = 120;
var TOUCH_MOVE_TOLERANCE = 12;
var TOUCH_CLICK_DELAY = 700;
var BENCHMARK_SEED = 20260928;
var BENCHMARK_CASE_DELAY_MS = 25;
var BENCHMARK_DETAIL_PAGE_SIZE = 4;
var BENCHMARK_LEVELS = [1000, 1200, 1400];
var BENCHMARK_TIMES = [0.5, 1, 2, 4];
var BENCHMARK_POSITIONS = [
  { name: "Opening", fen: START_FEN, expected: "" },
  { name: "Middlegame", fen: "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1", expected: "" },
  { name: "Mate in one", fen: "7k/5Q2/6K1/8/8/8/8/8 w - - 0 1", expected: "mate" },
  { name: "Save rook", fen: "7k/8/8/8/8/q7/R7/7K w - - 0 1", expected: "a2a3" },
  { name: "Pawn endgame", fen: "8/5pk1/6p1/3P4/5PP1/4K3/8/8 w - - 0 1", expected: "" }
];
var SQ_SIZE = 72;
var BoardSize = 0;
var BoardFlipped = null;
var RenderedPieces = [];
var PieceImages = [];
var HighlightedSquares = [];
var CachedMoveKey = null;
var CachedMoveCount = 0;
var CachedMoves = [];
var BoardTouch = null;
var IgnoreClicksUntil = 0;
var UserMove = { from: SQUARES.NO_SQ, to: SQUARES.NO_SQ };
var LastFrom = SQUARES.NO_SQ;
var LastTo = SQUARES.NO_SQ;
var LastMoveWasEngine = false;
var searchTimer = null;
var srch_abort = BOOL.FALSE;
var SetupOpen = true;
var AutoPlay = false;
var InputSide = COLOURS.BOTH;
var BenchmarkRunning = false;
var BenchmarkStopRequested = false;
var BenchmarkCases = [];
var BenchmarkResults = [];
var BenchmarkCaseIndex = 0;
var BenchmarkSuiteStart = 0;
var BenchmarkBookLoaded = BOOL.TRUE;
var BenchmarkDetailPage = 0;

var MirrorFiles = [FILES.FILE_H, FILES.FILE_G, FILES.FILE_F, FILES.FILE_E, FILES.FILE_D, FILES.FILE_C, FILES.FILE_B, FILES.FILE_A];
var MirrorRanks = [RANKS.RANK_8, RANKS.RANK_7, RANKS.RANK_6, RANKS.RANK_5, RANKS.RANK_4, RANKS.RANK_3, RANKS.RANK_2, RANKS.RANK_1];

function MIRROR120(sq) {
  return FR2SQ(MirrorFiles[FilesBrd[sq]], MirrorRanks[RanksBrd[sq]]);
}

function ById(id) {
  return document.getElementById(id);
}

function PieceFileName(pce) {
  return "images/" + SideChar.charAt(PieceCol[pce]) + PceChar.charAt(pce).toUpperCase() + ".png";
}

function PreloadPieces() {
  var pce;
  var img;
  PieceImages = [];
  for (pce = PIECES.wP; pce <= PIECES.bK; pce++) {
    img = document.createElement("img");
    img.src = PieceFileName(pce);
    PieceImages.push(img);
  }
}

function SetStatus(text) {
  var el = ById("status");
  if (el && el.innerHTML != text) el.innerHTML = text;
}

function SetStats(text) {
  var el = ById("stats");
  if (el && el.innerHTML != text) el.innerHTML = text;
}

function SideName(side) {
  return side == COLOURS.WHITE ? "White" : "Black";
}

function ScoreText(score) {
  if (Math.abs(score) > MATE - MAXDEPTH) {
    return "mate " + (MATE - Math.abs(score));
  }
  var pawn = (score / 100).toFixed(1);
  if (score > 0) return "+" + pawn;
  return "" + pawn;
}

function GameResult() {
  if (brd_fiftyMove >= 100) return "Draw, 50-move";
  if (ThreeFoldRep() >= 2) return "Draw, repetition";
  if (DrawMaterial() == BOOL.TRUE) return "Draw, material";
  CacheLegalMoves();
  if (CachedMoveCount != 0) return "";
  if (InCheckNow() == BOOL.TRUE) {
    if (brd_side == COLOURS.WHITE) return "Black mates";
    return "White mates";
  }
  return "Draw, stalemate";
}

function CheckAndSet() {
  var result = GameResult();
  if (result == "") {
    GameController.GameOver = BOOL.FALSE;
    if (InCheckNow() == BOOL.TRUE) SetStatus("Check. " + SideName(brd_side) + " to move");
    else if (InputSide == brd_side) SetStatus("Enter " + SideName(brd_side) + " move");
    else SetStatus(SideName(brd_side) + " to move");
  } else {
    GameController.GameOver = BOOL.TRUE;
    SetStatus(result);
  }
}

function LayoutBoard() {
  var w = document.documentElement.clientWidth || 600;
  var h = document.documentElement.clientHeight || 800;
  if (window.innerWidth > 0 && window.innerWidth < w) w = window.innerWidth;
  if (window.innerHeight > 0 && window.innerHeight < h) h = window.innerHeight;
  SQ_SIZE = Math.max(1, Math.min(MAX_SQUARE_SIZE,
    Math.floor((w - LAYOUT_EDGE_SPACE) / 8),
    Math.floor((h - LAYOUT_PANEL_SPACE - LAYOUT_TOP_SPACE) / 8)));
  var boardEl = ById("board");
  if (boardEl) boardEl.style.marginTop = LAYOUT_TOP_SPACE + "px";
  var panelEl = ById("panel");
  if (panelEl) panelEl.style.width = SQ_SIZE * 8 + 4 + "px";
  var controls = ById("controls");
  if (controls) controls.className = SQ_SIZE * 8 + 4 <= NARROW_PANEL_WIDTH ? "compact narrow" :
    SQ_SIZE * 8 + 4 <= COMPACT_PANEL_WIDTH ? "compact" : "";
}

function DrawBoard() {
  var boardEl = ById("board");
  if (!boardEl) return;
  var boardPx = SQ_SIZE * 8;
  var flipped = GameController.BoardFlipped == BOOL.TRUE;
  var rebuild = BoardSize != SQ_SIZE || BoardFlipped != flipped;
  if (rebuild) {
    boardEl.style.width = boardPx + "px";
    boardEl.style.height = boardPx + "px";
    boardEl.innerHTML = "";
    RenderedPieces = [];
    BoardSize = SQ_SIZE;
    BoardFlipped = flipped;
  }
  var row;
  var col;
  var file;
  var rank;
  var sq;
  var div;
  var img;
  var pce;
  var className;
  var hints = UserMove.from != SQUARES.NO_SQ ? MoveHints(UserMove.from) : [];
  HighlightedSquares = [];
  for (row = 0; row < 8; row++) {
    for (col = 0; col < 8; col++) {
      if (flipped) {
        file = 7 - col;
        rank = row;
      } else {
        file = col;
        rank = 7 - row;
      }
      sq = FR2SQ(file, rank);
      div = rebuild ? document.createElement("div") : ById("sq-" + sq);
      if (rebuild) {
        div.id = "sq-" + sq;
        div.style.left = col * SQ_SIZE + "px";
        div.style.top = row * SQ_SIZE + "px";
        div.style.width = SQ_SIZE + "px";
        div.style.height = SQ_SIZE + "px";
      }
      className = SquareClassName(sq, hints);
      if (sq == UserMove.from || hints[sq]) HighlightedSquares[sq] = true;
      if (div.className != className) div.className = className;
      pce = brd_pieces[sq];
      if (RenderedPieces[sq] != pce) {
        img = div.firstChild;
        if (pce >= PIECES.wP && pce <= PIECES.bK) {
          if (!img) {
            img = document.createElement("img");
            img.width = SQ_SIZE;
            img.height = SQ_SIZE;
            img.className = "piece";
            img.draggable = false;
            div.appendChild(img);
          }
          img.src = PieceFileName(pce);
        } else if (img) {
          div.removeChild(img);
        }
        RenderedPieces[sq] = pce;
      }
      if (rebuild) boardEl.appendChild(div);
    }
  }
  DrawMoveArrow();
}

function DrawMoveArrow() {
  var canvas = ById("move-arrow");
  if (!LastMoveWasEngine || LastFrom == SQUARES.NO_SQ || LastTo == SQUARES.NO_SQ) {
    if (canvas && canvas.style.display != "none") canvas.style.display = "none";
    return;
  }
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.id = "move-arrow";
    canvas.style.position = "absolute";
    canvas.style.left = "0";
    canvas.style.top = "0";
    canvas.style.zIndex = "1";
    canvas.style.pointerEvents = "none";
    ById("board").appendChild(canvas);
  }
  if (!canvas.getContext) return;
  var context = canvas.getContext("2d");
  if (!context) return;
  canvas.width = SQ_SIZE * 8;
  canvas.height = SQ_SIZE * 8;
  canvas.style.display = "block";
  var flipped = GameController.BoardFlipped == BOOL.TRUE;
  var from = flipped ? MIRROR120(LastFrom) : LastFrom;
  var to = flipped ? MIRROR120(LastTo) : LastTo;
  var startX = (FilesBrd[from] + 0.5) * SQ_SIZE;
  var startY = (7.5 - RanksBrd[from]) * SQ_SIZE;
  var endX = (FilesBrd[to] + 0.5) * SQ_SIZE;
  var endY = (7.5 - RanksBrd[to]) * SQ_SIZE;
  var dx = endX - startX;
  var dy = endY - startY;
  var length = Math.sqrt(dx * dx + dy * dy);
  var ux = dx / length;
  var uy = dy / length;
  var head = SQ_SIZE * ARROW_HEAD_RATIO;
  endX -= ux * SQ_SIZE * ARROW_TIP_OFFSET;
  endY -= uy * SQ_SIZE * ARROW_TIP_OFFSET;
  var baseX = endX - ux * head;
  var baseY = endY - uy * head;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.beginPath();
  context.moveTo(startX, startY);
  context.lineTo(baseX, baseY);
  context.strokeStyle = "#fff";
  context.lineWidth = SQ_SIZE * (ARROW_LINE_RATIO + ARROW_OUTLINE_RATIO * 2);
  context.stroke();
  context.strokeStyle = "#000";
  context.lineWidth = SQ_SIZE * ARROW_LINE_RATIO;
  context.stroke();
  context.beginPath();
  context.moveTo(endX, endY);
  context.lineTo(baseX - uy * head / 2, baseY + ux * head / 2);
  context.lineTo(baseX + uy * head / 2, baseY - ux * head / 2);
  context.closePath();
  context.strokeStyle = "#fff";
  context.lineWidth = SQ_SIZE * ARROW_OUTLINE_RATIO * 2;
  context.stroke();
  context.fillStyle = "#000";
  context.fill();
}

function CacheLegalMoves() {
  if (CachedMoveKey === brd_posKey) return;
  CachedMoves = [];
  CachedMoveCount = 0;
  GenerateMoves();
  var i;
  var mv;
  var from;
  var promoted;
  for (i = brd_moveListStart[brd_ply]; i < brd_moveListStart[brd_ply + 1]; i++) {
    mv = brd_moveList[i];
    if (MakeMove(mv) == BOOL.FALSE) continue;
    TakeMove();
    CachedMoveCount++;
    promoted = PROMOTED(mv);
    if (promoted != PIECES.EMPTY && promoted != PIECES.wQ && promoted != PIECES.bQ) continue;
    from = FROMSQ(mv);
    if (!CachedMoves[from]) CachedMoves[from] = [];
    CachedMoves[from][TOSQ(mv)] = mv;
  }
  CachedMoveKey = brd_posKey;
}

function MoveHints(from) {
  CacheLegalMoves();
  return CachedMoves[from] || [];
}

function SquareClassName(sq, hints) {
  var light = (FilesBrd[sq] + RanksBrd[sq]) % 2 != 0;
  var name = "square " + (light ? "light" : "dark");
  if (sq == LastFrom || sq == LastTo) name += " last";
  if (sq == UserMove.from) name += " selected";
  if (hints[sq]) name += " hint";
  return name;
}

function SelectSquare(from) {
  var changed = HighlightedSquares;
  HighlightedSquares = [];
  UserMove.from = from;
  UserMove.to = SQUARES.NO_SQ;
  var hints = from != SQUARES.NO_SQ ? MoveHints(from) : [];
  var sq;
  var el;
  var name;
  if (from != SQUARES.NO_SQ) {
    changed[from] = true;
    HighlightedSquares[from] = true;
  }
  for (sq in hints) {
    if (!hints.hasOwnProperty(sq)) continue;
    changed[sq] = true;
    HighlightedSquares[sq] = true;
  }
  for (sq in changed) {
    if (!changed.hasOwnProperty(sq)) continue;
    el = ById("sq-" + sq);
    if (!el) continue;
    name = SquareClassName(sq, hints);
    if (el.className != name) el.className = name;
  }
}

function Deselect() {
  SelectSquare(SQUARES.NO_SQ);
}

function PlayMove(move, engineMove, deferCheck) {
  if (move == NOMOVE) return;
  if (MakeMove(move) == BOOL.FALSE) return;
  LastFrom = FROMSQ(move);
  LastTo = TOSQ(move);
  LastMoveWasEngine = engineMove === true;
  UserMove.from = SQUARES.NO_SQ;
  UserMove.to = SQUARES.NO_SQ;
  DrawBoard();
  if (deferCheck !== true) CheckAndSet();
}

function FinishPlayerMove() {
  searchTimer = null;
  if (srch_abort == BOOL.TRUE || SetupOpen) {
    srch_thinking = BOOL.FALSE;
    return;
  }
  srch_thinking = BOOL.FALSE;
  CheckAndSet();
  if (GameController.GameOver != BOOL.TRUE) PreSearch();
}

function QueuePlayerMove() {
  srch_abort = BOOL.FALSE;
  srch_thinking = BOOL.TRUE;
  searchTimer = setTimeout(FinishPlayerMove, PLAYER_FEEDBACK_DELAY_MS);
}

function FinishEngineMove() {
  searchTimer = null;
  srch_thinking = BOOL.FALSE;
  if (srch_abort == BOOL.TRUE) return;
  var move = srch_best;
  if (move == NOMOVE) {
    SetAutoPlay(false);
    CheckAndSet();
    return;
  }
  if (MoveExists(move) != BOOL.TRUE) {
    SetAutoPlay(false);
    GameController.GameOver = BOOL.TRUE;
    SetStatus("Engine error. Press New.");
    SetStats("Illegal engine move rejected");
    return;
  }
  var line = "";
  if (srch_fromBook == BOOL.TRUE) {
    SetStats("Book " + PrMove(move));
  } else {
    line = "d" + srch_depthFound + " " + ScoreText(srch_score) + " n" + srch_nodes;
    SetStats(line);
  }
  PlayMove(move, true);
  if (GameController.GameOver == BOOL.TRUE) {
    SetAutoPlay(false);
  } else if (AutoPlay || brd_side != GameController.PlayerSide) {
    PreSearch(AutoPlay ? AUTO_MOVE_PAUSE_MS : SEARCH_START_DELAY_MS);
  }
}

function SearchStep() {
  if (srch_abort == BOOL.TRUE) {
    searchTimer = null;
    srch_thinking = BOOL.FALSE;
    return;
  }
  if (srch_thinking != BOOL.TRUE) {
    FinishEngineMove();
    return;
  }
  var done = SearchIterate();
  if (done == BOOL.TRUE) {
    FinishEngineMove();
    return;
  }
  searchTimer = setTimeout(SearchStep, 1);
}

function StartSearch() {
  if (srch_abort == BOOL.TRUE) {
    srch_thinking = BOOL.FALSE;
    return;
  }
  srch_depth = MAXDEPTH;
  var difficulty = ById("difficulty");
  SetDifficulty(difficulty ? difficulty.value : DEFAULT_DIFFICULTY);
  var choice = ById("time");
  var seconds = DEFAULT_SEARCH_SECONDS;
  if (choice) seconds = parseFloat(choice.value);
  if (!(seconds > 0)) seconds = DEFAULT_SEARCH_SECONDS;
  srch_time = seconds * 1000;
  SetStatus("Thinking...");
  SetStats("");
  if (SearchBegin() == BOOL.TRUE) {
    FinishEngineMove();
    return;
  }
  searchTimer = setTimeout(SearchStep, 1);
}

function PreSearch(delay) {
  if (SetupOpen) return;
  if (GameController.GameOver == BOOL.TRUE) return;
  if (srch_thinking == BOOL.TRUE) return;
  srch_abort = BOOL.FALSE;
  srch_thinking = BOOL.TRUE;
  SetStatus("Thinking...");
  searchTimer = setTimeout(StartSearch, delay || SEARCH_START_DELAY_MS);
}

function HandleSquareClick(sq) {
  if (SetupOpen || AutoPlay) return;
  if (srch_thinking == BOOL.TRUE) return;
  if (GameController.GameOver == BOOL.TRUE) return;
  if (GameController.PlayerSide != brd_side) return;
  var pce = brd_pieces[sq];
  if (UserMove.from == SQUARES.NO_SQ) {
    if (pce != PIECES.EMPTY && PieceCol[pce] == brd_side) {
      SelectSquare(sq);
    }
    return;
  }
  if (sq == UserMove.from) {
    Deselect();
    return;
  }
  if (pce != PIECES.EMPTY && PieceCol[pce] == brd_side) {
    SelectSquare(sq);
    return;
  }
  var parsed = MoveHints(UserMove.from)[sq] || NOMOVE;
  if (parsed == NOMOVE) {
    Deselect();
    return;
  }
  PlayMove(parsed, false, true);
  QueuePlayerMove();
}

function OnBoardClick(e) {
  e = e || window.event;
  if (Now() < IgnoreClicksUntil) {
    if (e.preventDefault) e.preventDefault();
    return false;
  }
  return ActivateBoardSquare(e);
}

function ActivateBoardSquare(e) {
  var target = e.target || e.srcElement;
  if (target && target.id == "move-arrow") {
    var point = e.changedTouches ? e.changedTouches[0] : e;
    var rect = ById("board").getBoundingClientRect();
    var col = Math.floor((point.clientX - rect.left - ById("board").clientLeft) / SQ_SIZE);
    var row = Math.floor((point.clientY - rect.top - ById("board").clientTop) / SQ_SIZE);
    if (col < 0 || col > 7 || row < 0 || row > 7) return;
    var square = FR2SQ(col, 7 - row);
    if (GameController.BoardFlipped == BOOL.TRUE) square = MIRROR120(square);
    HandleSquareClick(square);
    if (e.preventDefault) e.preventDefault();
    return false;
  }
  while (target && target.id != "board" && (!target.id || target.id.indexOf("sq-") != 0)) {
    target = target.parentNode;
  }
  if (!target || !target.id || target.id.indexOf("sq-") != 0) return;
  var sq = parseInt(target.id.substring(3), 10);
  HandleSquareClick(sq);
  if (e && e.preventDefault) e.preventDefault();
  return false;
}

function OnBoardTouchStart(e) {
  BoardTouch = null;
  if (e.touches.length != 1) return;
  var touch = e.touches[0];
  BoardTouch = { id: touch.identifier, x: touch.clientX, y: touch.clientY };
}

function OnBoardTouchMove(e) {
  if (!BoardTouch) return;
  if (e.touches.length != 1) {
    BoardTouch = null;
    return;
  }
  var touch = e.touches[0];
  if (touch.identifier != BoardTouch.id ||
      Math.abs(touch.clientX - BoardTouch.x) > TOUCH_MOVE_TOLERANCE ||
      Math.abs(touch.clientY - BoardTouch.y) > TOUCH_MOVE_TOLERANCE) BoardTouch = null;
}

function OnBoardTouchEnd(e) {
  var start = BoardTouch;
  BoardTouch = null;
  if (!e.cancelable) return;
  e.preventDefault();
  IgnoreClicksUntil = Now() + TOUCH_CLICK_DELAY;
  if (!start || e.touches.length != 0 || e.changedTouches.length != 1) return;
  var touch = e.changedTouches[0];
  if (touch.identifier != start.id ||
      Math.abs(touch.clientX - start.x) > TOUCH_MOVE_TOLERANCE ||
      Math.abs(touch.clientY - start.y) > TOUCH_MOVE_TOLERANCE) return;
  ActivateBoardSquare(e);
}

function OnBoardTouchCancel() {
  BoardTouch = null;
  IgnoreClicksUntil = Now() + TOUCH_CLICK_DELAY;
}

function StopSearch() {
  if (searchTimer) {
    clearTimeout(searchTimer);
    searchTimer = null;
  }
  srch_abort = BOOL.TRUE;
  srch_thinking = BOOL.FALSE;
  srch_stop = BOOL.TRUE;
}

function UpdateControlState() {
  var testMode = InputSide != COLOURS.BOTH;
  ById("flip").disabled = AutoPlay;
  ById("undo").disabled = AutoPlay;
  ById("go").disabled = AutoPlay || testMode;
  ById("auto").disabled = testMode;
}

function SetAutoPlay(active) {
  AutoPlay = active;
  ById("auto").innerHTML = active ? "Stop" : "Auto";
  ById("auto").setAttribute("aria-pressed", active ? "true" : "false");
  UpdateControlState();
}

function ToggleAutoPlay() {
  if (SetupOpen || InputSide != COLOURS.BOTH) return;
  if (AutoPlay) {
    StopSearch();
    SetAutoPlay(false);
    GameController.PlayerSide = brd_side;
    CheckAndSet();
    return;
  }
  if (GameController.GameOver == BOOL.TRUE) return;
  SetAutoPlay(true);
  Deselect();
  if (srch_thinking != BOOL.TRUE) PreSearch();
}

function ShowSetup() {
  StopSearch();
  InputSide = COLOURS.BOTH;
  SetAutoPlay(false);
  SetupOpen = true;
  BoardTouch = null;
  ById("game").style.display = "none";
  ById("benchmark").style.display = "none";
  ById("setup").style.display = "block";
}

function FormatBenchmarkDuration(milliseconds) {
  var seconds = Math.max(0, Math.round(milliseconds / 1000));
  var minutes = Math.floor(seconds / 60);
  seconds %= 60;
  if (minutes > 0) return minutes + "m " + seconds + "s";
  return seconds + "s";
}

function BenchmarkMaximumMilliseconds(cases) {
  var total = 0;
  for (var index = 0; index < cases.length; index++) total += cases[index].seconds * 1000;
  return total;
}

function BuildBenchmarkCases() {
  var cases = [];
  var positionIndex;
  var levelIndex;
  var timeIndex;
  for (positionIndex = 0; positionIndex < BENCHMARK_POSITIONS.length; positionIndex++) {
    for (levelIndex = 0; levelIndex < BENCHMARK_LEVELS.length; levelIndex++) {
      for (timeIndex = 0; timeIndex < BENCHMARK_TIMES.length; timeIndex++) {
        cases.push({
          position: BENCHMARK_POSITIONS[positionIndex],
          level: BENCHMARK_LEVELS[levelIndex],
          seconds: BENCHMARK_TIMES[timeIndex]
        });
      }
    }
  }
  return cases;
}

function CreateBenchmarkRandom(caseIndex) {
  var state = (BENCHMARK_SEED + caseIndex * 2654435761) >>> 0;
  return function () {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function SetBenchmarkButtons(running) {
  ById("benchmark-start").disabled = running;
  ById("benchmark-stop").disabled = !running;
  ById("benchmark-back").disabled = running;
}

function ShowBenchmark() {
  StopSearch();
  SetAutoPlay(false);
  SetupOpen = true;
  ById("setup").style.display = "none";
  ById("game").style.display = "none";
  ById("benchmark").style.display = "block";
  BenchmarkCases = BuildBenchmarkCases();
  ById("benchmark-version").innerHTML = "App " + GUI_SCRIPT_VERSION.split("-")[0] + " / Engine " + SCRIPT_VERSION.split("-")[0];
  ById("benchmark-config").innerHTML = BENCHMARK_POSITIONS.length + " positions &times; " + BENCHMARK_LEVELS.length +
    " levels &times; " + BENCHMARK_TIMES.length + " limits = " + BenchmarkCases.length +
    " cases. Book off; seed " + BENCHMARK_SEED + "; search reset per case.";
  ById("benchmark-estimate").innerHTML = "Estimated duration: about 2 minutes; search-time ceiling " +
    FormatBenchmarkDuration(BenchmarkMaximumMilliseconds(BenchmarkCases)) + ".";
  if (!BenchmarkResults.length) {
    ById("benchmark-progress").innerHTML = "Ready";
    ById("benchmark-current").innerHTML = "The benchmark does not change difficulty settings.";
  }
  SetBenchmarkButtons(false);
}

function BenchmarkStart() {
  if (BenchmarkRunning) return;
  StopSearch();
  BenchmarkCases = BuildBenchmarkCases();
  BenchmarkResults = [];
  BenchmarkCaseIndex = 0;
  BenchmarkDetailPage = 0;
  BenchmarkStopRequested = false;
  BenchmarkRunning = true;
  BenchmarkSuiteStart = Now();
  BenchmarkBookLoaded = GameController.BookLoaded;
  GameController.BookLoaded = BOOL.FALSE;
  srch_abort = BOOL.FALSE;
  ById("benchmark-summary").innerHTML = "";
  ById("benchmark-detail").innerHTML = "";
  ById("benchmark-pages").style.display = "none";
  ById("benchmark-bar-fill").style.width = "0%";
  SetBenchmarkButtons(true);
  BenchmarkStartCase();
}

function BenchmarkStartCase() {
  if (BenchmarkStopRequested || BenchmarkCaseIndex >= BenchmarkCases.length) {
    BenchmarkFinishSuite(BenchmarkStopRequested);
    return;
  }
  var testCase = BenchmarkCases[BenchmarkCaseIndex];
  ParseFen(testCase.position.fen);
  SetDifficulty(testCase.level);
  srch_depth = MAXDEPTH;
  srch_time = testCase.seconds * 1000;
  SetSearchRandom(CreateBenchmarkRandom(BenchmarkCaseIndex));
  GameController.BookLoaded = BOOL.FALSE;
  ById("benchmark-progress").innerHTML = "Case " + (BenchmarkCaseIndex + 1) + " of " + BenchmarkCases.length;
  ById("benchmark-current").innerHTML = testCase.position.name + " &middot; " + testCase.level + " &middot; " + testCase.seconds +
    "s max<br />Elapsed " + FormatBenchmarkDuration(Now() - BenchmarkSuiteStart) + "; up to " +
    FormatBenchmarkDuration(BenchmarkRemainingMaximum()) + " remaining";
  SearchBegin();
  searchTimer = setTimeout(BenchmarkSearchStep, BENCHMARK_CASE_DELAY_MS);
}

function BenchmarkRemainingMaximum() {
  var remaining = 0;
  for (var index = BenchmarkCaseIndex; index < BenchmarkCases.length; index++) {
    remaining += BenchmarkCases[index].seconds * 1000;
  }
  if (BenchmarkCaseIndex < BenchmarkCases.length) {
    remaining -= Math.min(BenchmarkCases[BenchmarkCaseIndex].seconds * 1000, Math.max(0, Now() - srch_start));
  }
  return remaining;
}

function BenchmarkSearchStep() {
  searchTimer = null;
  if (BenchmarkStopRequested) {
    BenchmarkFinishSuite(true);
    return;
  }
  var done = SearchIterate();
  var completedPercent = Math.floor((BenchmarkCaseIndex * 100) / BenchmarkCases.length);
  ById("benchmark-bar-fill").style.width = completedPercent + "%";
  ById("benchmark-current").innerHTML = BenchmarkCases[BenchmarkCaseIndex].position.name + " &middot; " +
    BenchmarkCases[BenchmarkCaseIndex].level + " &middot; " + BenchmarkCases[BenchmarkCaseIndex].seconds +
    "s max &middot; depth " + srch_depthFound + " &middot; " + srch_nodes + " nodes<br />Elapsed " +
    FormatBenchmarkDuration(Now() - BenchmarkSuiteStart) + "; up to " + FormatBenchmarkDuration(BenchmarkRemainingMaximum()) + " remaining";
  if (done == BOOL.TRUE) {
    BenchmarkRecordCase();
    BenchmarkCaseIndex++;
    ById("benchmark-bar-fill").style.width = Math.floor((BenchmarkCaseIndex * 100) / BenchmarkCases.length) + "%";
    searchTimer = setTimeout(BenchmarkStartCase, BENCHMARK_CASE_DELAY_MS);
    return;
  }
  searchTimer = setTimeout(BenchmarkSearchStep, BENCHMARK_CASE_DELAY_MS);
}

function BenchmarkMateDelivered(move) {
  if (move == NOMOVE || MakeMove(move) == BOOL.FALSE) return false;
  var inCheck = SqAttacked(brd_pList[PCEINDEX(Kings[brd_side], 0)], brd_side ^ 1) == BOOL.TRUE;
  var legal = 0;
  GenerateMoves();
  for (var index = brd_moveListStart[brd_ply]; index < brd_moveListStart[brd_ply + 1]; index++) {
    if (MakeMove(brd_moveList[index]) == BOOL.FALSE) continue;
    TakeMove();
    legal++;
    break;
  }
  TakeMove();
  return inCheck && legal == 0;
}

function BenchmarkTacticalPass(position, move) {
  if (position.expected == "") return null;
  if (position.expected == "mate") return BenchmarkMateDelivered(move);
  return move != NOMOVE && PrMove(move) == position.expected;
}

function BenchmarkRecordCase() {
  var testCase = BenchmarkCases[BenchmarkCaseIndex];
  var elapsed = Math.max(1, Now() - srch_start);
  var reason = srch_endReason;
  if (reason == "") {
    if (srch_profile && srch_nodes >= srch_profile.nodes) reason = "nodes";
    else if (elapsed >= srch_time) reason = "time";
    else reason = "depth";
  }
  BenchmarkResults.push({
    position: testCase.position.name,
    level: testCase.level,
    seconds: testCase.seconds,
    elapsed: elapsed,
    depth: srch_depthFound,
    nodes: srch_nodes,
    nps: Math.round(srch_nodes * 1000 / elapsed),
    move: srch_best,
    score: srch_score,
    bestMove: srch_bestEvaluated,
    bestScore: srch_bestEvaluatedScore,
    reason: reason,
    tactical: BenchmarkTacticalPass(testCase.position, srch_best)
  });
}

function BenchmarkStop() {
  if (!BenchmarkRunning) return;
  BenchmarkStopRequested = true;
  srch_stop = BOOL.TRUE;
  srch_thinking = BOOL.FALSE;
  ById("benchmark-progress").innerHTML = "Stopping...";
}

function BenchmarkFinishSuite(stopped) {
  BenchmarkRunning = false;
  srch_thinking = BOOL.FALSE;
  searchTimer = null;
  SetSearchRandom(null);
  GameController.BookLoaded = BenchmarkBookLoaded;
  SetBenchmarkButtons(false);
  ById("benchmark-bar-fill").style.width = Math.floor((BenchmarkResults.length * 100) / BenchmarkCases.length) + "%";
  ById("benchmark-progress").innerHTML = stopped ? "Stopped: " + BenchmarkResults.length + " of " + BenchmarkCases.length +
    " cases" : "Complete: " + BenchmarkResults.length + " cases";
  ById("benchmark-current").innerHTML = "Elapsed " + FormatBenchmarkDuration(Now() - BenchmarkSuiteStart);
  BenchmarkRenderSummary();
  BenchmarkRenderDetails();
}

function BenchmarkRenderSummary() {
  var html = "<table><tr><th>Level</th><th>Depth</th><th>N/s</th><th>Tactics</th><th>Ends T/D/N</th></tr>";
  for (var levelIndex = 0; levelIndex < BENCHMARK_LEVELS.length; levelIndex++) {
    var level = BENCHMARK_LEVELS[levelIndex];
    var count = 0;
    var depth = 0;
    var nodes = 0;
    var elapsed = 0;
    var tacticalPass = 0;
    var tacticalTotal = 0;
    var endings = { time: 0, depth: 0, nodes: 0 };
    for (var resultIndex = 0; resultIndex < BenchmarkResults.length; resultIndex++) {
      var result = BenchmarkResults[resultIndex];
      if (result.level != level) continue;
      count++;
      depth += result.depth;
      nodes += result.nodes;
      elapsed += result.elapsed;
      if (result.tactical !== null) {
        tacticalTotal++;
        if (result.tactical) tacticalPass++;
      }
      if (endings[result.reason] !== undefined) endings[result.reason]++;
    }
    html += "<tr><td>" + level + "</td><td>" + (count ? (depth / count).toFixed(1) : "-") + "</td><td>" +
      (elapsed ? Math.round(nodes * 1000 / elapsed) : 0) + "</td><td>" + tacticalPass + "/" + tacticalTotal +
      "</td><td>" + endings.time + "/" + endings.depth + "/" + endings.nodes + "</td></tr>";
  }
  html += "</table><div class=\"benchmark-note\">T/D/N = time/depth/node budget. This measures device search speed, reached depth, budget limits, chosen versus best-evaluated moves, and two basic tactics. It does not establish Elo or broad playing strength; the presets remain uncalibrated.</div>";
  ById("benchmark-summary").innerHTML = html;
}

function BenchmarkRenderDetails() {
  var pageCount = Math.max(1, Math.ceil(BenchmarkResults.length / BENCHMARK_DETAIL_PAGE_SIZE));
  if (BenchmarkDetailPage >= pageCount) BenchmarkDetailPage = pageCount - 1;
  var first = BenchmarkDetailPage * BENCHMARK_DETAIL_PAGE_SIZE;
  var last = Math.min(BenchmarkResults.length, first + BENCHMARK_DETAIL_PAGE_SIZE);
  var html = "";
  for (var index = first; index < last; index++) {
    var result = BenchmarkResults[index];
    var tactical = result.tactical === null ? "" : result.tactical ? " &middot; tactic PASS" : " &middot; tactic FAIL";
    html += "<div class=\"benchmark-result\"><div class=\"benchmark-result-title\">" + (index + 1) + ". " + result.position +
      " &middot; " + result.level + " &middot; " + result.seconds + "s</div>" + (result.elapsed / 1000).toFixed(2) +
      "s &middot; d" + result.depth + " &middot; " + result.nodes + " nodes &middot; " + result.nps + " n/s &middot; " +
      result.reason + tactical + "<br />Best " + PrMove(result.bestMove) + " " + ScoreText(result.bestScore) +
      " &middot; played " + PrMove(result.move) + " " + ScoreText(result.score) + "</div>";
  }
  ById("benchmark-detail").innerHTML = html;
  ById("benchmark-pages").style.display = BenchmarkResults.length ? "block" : "none";
  ById("benchmark-page").innerHTML = "Page " + (BenchmarkDetailPage + 1) + "/" + pageCount;
  ById("benchmark-prev").disabled = BenchmarkDetailPage == 0;
  ById("benchmark-next").disabled = BenchmarkDetailPage >= pageCount - 1;
}

function BenchmarkPreviousPage() {
  if (BenchmarkDetailPage <= 0) return;
  BenchmarkDetailPage--;
  BenchmarkRenderDetails();
}

function BenchmarkNextPage() {
  if ((BenchmarkDetailPage + 1) * BENCHMARK_DETAIL_PAGE_SIZE >= BenchmarkResults.length) return;
  BenchmarkDetailPage++;
  BenchmarkRenderDetails();
}

function StartGame(mode) {
  var opponentWhite = mode == "test-white";
  var opponentBlack = mode == "test-black";
  var inputSide = opponentWhite ? COLOURS.WHITE : opponentBlack ? COLOURS.BLACK : COLOURS.BOTH;
  GameController.BoardFlipped = opponentWhite ? BOOL.TRUE : BOOL.FALSE;
  SetupOpen = false;
  IgnoreClicksUntil = 0;
  ById("setup").style.display = "none";
  ById("game").style.display = "block";
  LayoutBoard();
  NewGame(inputSide);
}

function NewGame(inputSide) {
  InputSide = inputSide === COLOURS.WHITE || inputSide === COLOURS.BLACK ? inputSide : COLOURS.BOTH;
  StopSearch();
  SetAutoPlay(false);
  SetupOpen = false;
  ParseFen(START_FEN);
  LastFrom = SQUARES.NO_SQ;
  LastTo = SQUARES.NO_SQ;
  LastMoveWasEngine = false;
  UserMove.from = SQUARES.NO_SQ;
  UserMove.to = SQUARES.NO_SQ;
  GameController.PlayerSide = InputSide == COLOURS.BOTH ? COLOURS.WHITE : InputSide;
  GameController.GameOver = BOOL.FALSE;
  DrawBoard();
  CheckAndSet();
  SetStats("");
  if (brd_side != GameController.PlayerSide) PreSearch();
}

function UndoMove() {
  if (SetupOpen || AutoPlay) return;
  if (srch_thinking == BOOL.TRUE) return;
  var retained = InputSide == COLOURS.BLACK ? 1 : 0;
  var available = brd_hisPly - retained;
  if (available <= 0) return;
  LastMoveWasEngine = false;
  var take = Math.min(2, available);
  var i;
  for (i = 0; i < take; i++) {
    if (brd_hisPly > 0) TakeMove();
  }
  brd_ply = 0;
  if (brd_hisPly > 0) {
    LastFrom = FROMSQ(brd_history[brd_hisPly - 1].move);
    LastTo = TOSQ(brd_history[brd_hisPly - 1].move);
  } else {
    LastFrom = SQUARES.NO_SQ;
    LastTo = SQUARES.NO_SQ;
  }
  UserMove.from = SQUARES.NO_SQ;
  UserMove.to = SQUARES.NO_SQ;
  DrawBoard();
  CheckAndSet();
}

function FlipBoard() {
  if (SetupOpen || AutoPlay) return;
  if (srch_thinking == BOOL.TRUE) return;
  GameController.BoardFlipped = GameController.BoardFlipped == BOOL.TRUE ? BOOL.FALSE : BOOL.TRUE;
  if (InputSide == COLOURS.BOTH) {
    GameController.PlayerSide = GameController.BoardFlipped == BOOL.TRUE ? COLOURS.BLACK : COLOURS.WHITE;
  }
  DrawBoard();
  CheckAndSet();
  if (GameController.GameOver != BOOL.TRUE && brd_side != GameController.PlayerSide) PreSearch();
}

function GoMove() {
  if (SetupOpen || AutoPlay) return;
  if (InputSide != COLOURS.BOTH) return;
  if (srch_thinking == BOOL.TRUE) return;
  if (GameController.GameOver == BOOL.TRUE) return;
  GameController.PlayerSide = brd_side ^ 1;
  PreSearch();
}

function Bind(el, ev, fn) {
  if (!el) return;
  if (el.addEventListener) el.addEventListener(ev, fn, false);
  else if (el.attachEvent) el.attachEvent("on" + ev, fn);
  else el["on" + ev] = fn;
}

function InitGui() {
  var version = ById("version");
  if (version) {
    version.innerHTML = GUI_SCRIPT_VERSION.split("-")[0];
    version.title = GUI_SCRIPT_VERSION;
  }
  var setupVersion = ById("setup-version");
  setupVersion.innerHTML = "Version " + GUI_SCRIPT_VERSION.split("-")[0];
  setupVersion.title = GUI_SCRIPT_VERSION;
  PreloadPieces();
  LayoutBoard();
  var boardEl = ById("board");
  Bind(boardEl, "click", OnBoardClick);
  Bind(boardEl, "touchstart", OnBoardTouchStart);
  Bind(boardEl, "touchmove", OnBoardTouchMove);
  Bind(boardEl, "touchend", OnBoardTouchEnd);
  Bind(boardEl, "touchcancel", OnBoardTouchCancel);
  Bind(ById("new"), "click", ShowSetup);
  Bind(ById("normal-game"), "click", function () { StartGame("normal"); });
  Bind(ById("test-black"), "click", function () { StartGame("test-black"); });
  Bind(ById("test-white"), "click", function () { StartGame("test-white"); });
  Bind(ById("benchmark-menu"), "click", ShowBenchmark);
  Bind(ById("benchmark-start"), "click", BenchmarkStart);
  Bind(ById("benchmark-stop"), "click", BenchmarkStop);
  Bind(ById("benchmark-back"), "click", ShowSetup);
  Bind(ById("benchmark-prev"), "click", BenchmarkPreviousPage);
  Bind(ById("benchmark-next"), "click", BenchmarkNextPage);
  Bind(ById("flip"), "click", FlipBoard);
  Bind(ById("undo"), "click", UndoMove);
  Bind(ById("go"), "click", GoMove);
  Bind(ById("auto"), "click", ToggleAutoPlay);
  Bind(window, "resize", function () {
    if (SetupOpen) return;
    LayoutBoard();
    DrawBoard();
  });
  Bind(window, "orientationchange", function () {
    if (SetupOpen) return;
    LayoutBoard();
    DrawBoard();
  });
  ShowSetup();
}

function InitPage() {
  InitEngine();
  InitGui();
}

if (document.addEventListener) {
  document.addEventListener("DOMContentLoaded", InitPage, false);
} else if (window.attachEvent) {
  window.attachEvent("onload", InitPage);
} else {
  window.onload = InitPage;
}
