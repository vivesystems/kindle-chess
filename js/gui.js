var GUI_SCRIPT_VERSION = "v1.5.0-202609171958";
var DEFAULT_OPENING_MOVE = "e2e4";
var ARROW_LINE_RATIO = 0.06;
var ARROW_OUTLINE_RATIO = 0.04;
var ARROW_HEAD_RATIO = 0.22;
var ARROW_TIP_OFFSET = 0.34;
var LAYOUT_TOP_SPACE = 48;
var LAYOUT_EDGE_SPACE = 8;
var LAYOUT_PANEL_SPACE = 150;
var MAX_SQUARE_SIZE = 120;
var TOUCH_MOVE_TOLERANCE = 12;
var TOUCH_CLICK_DELAY = 700;
var SQ_SIZE = 72;
var BoardSize = 0;
var BoardFlipped = null;
var RenderedPieces = [];
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
var StartingHistoryPly = 0;

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

function SetStatus(text) {
  var el = ById("status");
  if (el) el.innerHTML = text;
}

function SetStats(text) {
  var el = ById("stats");
  if (el) el.innerHTML = text;
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

function PlayMove(move, engineMove) {
  if (move == NOMOVE) return;
  if (MakeMove(move) == BOOL.FALSE) return;
  LastFrom = FROMSQ(move);
  LastTo = TOSQ(move);
  LastMoveWasEngine = engineMove === true;
  UserMove.from = SQUARES.NO_SQ;
  UserMove.to = SQUARES.NO_SQ;
  DrawBoard();
  CheckAndSet();
}

function FinishEngineMove() {
  searchTimer = null;
  srch_thinking = BOOL.FALSE;
  if (srch_abort == BOOL.TRUE) return;
  var move = srch_best;
  if (move == NOMOVE) {
    CheckAndSet();
    return;
  }
  if (MoveExists(move) != BOOL.TRUE) {
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
  if (GameController.GameOver != BOOL.TRUE && brd_side != GameController.PlayerSide) {
    PreSearch();
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
  var elapsed = ((Now() - srch_start) / 1000).toFixed(1);
  SetStats("d" + srch_depthFound + " " + ScoreText(srch_score) + " n" + srch_nodes + " " + elapsed + "s");
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
  var choice = ById("time");
  var seconds = 2;
  if (choice) seconds = parseInt(choice.value, 10);
  if (!seconds) seconds = 2;
  srch_time = seconds * 1000;
  SetStatus("Thinking...");
  SetStats("");
  if (SearchBegin() == BOOL.TRUE) {
    FinishEngineMove();
    return;
  }
  searchTimer = setTimeout(SearchStep, 1);
}

function PreSearch() {
  if (SetupOpen) return;
  if (GameController.GameOver == BOOL.TRUE) return;
  if (srch_thinking == BOOL.TRUE) return;
  srch_abort = BOOL.FALSE;
  srch_thinking = BOOL.TRUE;
  SetStatus("Thinking...");
  searchTimer = setTimeout(StartSearch, 40);
}

function HandleSquareClick(sq) {
  if (SetupOpen) return;
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
  PlayMove(parsed);
  if (GameController.GameOver != BOOL.TRUE) PreSearch();
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

function UpdateSetup() {
  var test = ById("game-mode").value == "test";
  var white = ById("opponent-side").value == "white";
  ById("test-options").style.display = test ? "block" : "none";
  ById("opening-options").style.display = white ? "block" : "none";
  ById("setup-description").innerHTML = test && white ?
    "Choose White's opening move, then play Black against the opponent." :
    "You play White. The opponent plays Black.";
}

function PopulateOpenings() {
  ParseFen(START_FEN);
  CacheLegalMoves();
  var moves = [];
  var from;
  var to;
  for (from in CachedMoves) {
    if (!CachedMoves.hasOwnProperty(from)) continue;
    for (to in CachedMoves[from]) {
      if (CachedMoves[from].hasOwnProperty(to)) moves.push(PrMove(CachedMoves[from][to]));
    }
  }
  moves.sort();
  var select = ById("opening-move");
  var i;
  var option;
  for (i = 0; i < moves.length; i++) {
    option = document.createElement("option");
    option.value = moves[i];
    option.appendChild(document.createTextNode(moves[i].substring(0, 2) + "-" + moves[i].substring(2)));
    select.appendChild(option);
  }
  select.value = DEFAULT_OPENING_MOVE;
}

function ShowSetup() {
  StopSearch();
  SetupOpen = true;
  BoardTouch = null;
  ById("game").style.display = "none";
  ById("setup").style.display = "block";
  UpdateSetup();
}

function StartGame() {
  var opponentWhite = ById("game-mode").value == "test" && ById("opponent-side").value == "white";
  GameController.BoardFlipped = opponentWhite ? BOOL.TRUE : BOOL.FALSE;
  SetupOpen = false;
  IgnoreClicksUntil = 0;
  ById("setup").style.display = "none";
  ById("game").style.display = "block";
  LayoutBoard();
  NewGame(opponentWhite ? ById("opening-move").value : "");
}

function NewGame(opening) {
  StopSearch();
  SetupOpen = false;
  StartingHistoryPly = 0;
  ParseFen(START_FEN);
  LastFrom = SQUARES.NO_SQ;
  LastTo = SQUARES.NO_SQ;
  LastMoveWasEngine = false;
  UserMove.from = SQUARES.NO_SQ;
  UserMove.to = SQUARES.NO_SQ;
  GameController.PlayerSide = GameController.BoardFlipped == BOOL.TRUE ? COLOURS.BLACK : COLOURS.WHITE;
  GameController.GameOver = BOOL.FALSE;
  DrawBoard();
  CheckAndSet();
  SetStats("");
  if (opening) {
    var move = ParseMove(SqFromAlg(opening.substring(0, 2)), SqFromAlg(opening.substring(2, 4)));
    if (move == NOMOVE) {
      ShowSetup();
      ById("setup-description").innerHTML = "Choose a legal opening move.";
      return;
    }
    PlayMove(move, true);
    StartingHistoryPly = brd_hisPly;
    SetStats("Opening " + opening.substring(0, 2) + "-" + opening.substring(2, 4));
  }
  if (brd_side != GameController.PlayerSide) PreSearch();
}

function UndoMove() {
  if (SetupOpen) return;
  if (srch_thinking == BOOL.TRUE) return;
  var available = brd_hisPly - StartingHistoryPly;
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
  if (SetupOpen) return;
  if (srch_thinking == BOOL.TRUE) return;
  GameController.BoardFlipped = GameController.BoardFlipped == BOOL.TRUE ? BOOL.FALSE : BOOL.TRUE;
  GameController.PlayerSide = GameController.BoardFlipped == BOOL.TRUE ? COLOURS.BLACK : COLOURS.WHITE;
  DrawBoard();
  CheckAndSet();
  if (GameController.GameOver != BOOL.TRUE && brd_side != GameController.PlayerSide) PreSearch();
}

function GoMove() {
  if (SetupOpen) return;
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
  ById("setup-version").innerHTML = GUI_SCRIPT_VERSION.split("-")[0];
  ById("setup-version").title = GUI_SCRIPT_VERSION;
  LayoutBoard();
  var boardEl = ById("board");
  Bind(boardEl, "click", OnBoardClick);
  Bind(boardEl, "touchstart", OnBoardTouchStart);
  Bind(boardEl, "touchmove", OnBoardTouchMove);
  Bind(boardEl, "touchend", OnBoardTouchEnd);
  Bind(boardEl, "touchcancel", OnBoardTouchCancel);
  Bind(ById("new"), "click", ShowSetup);
  Bind(ById("game-mode"), "change", UpdateSetup);
  Bind(ById("opponent-side"), "change", UpdateSetup);
  Bind(ById("start-game"), "click", StartGame);
  Bind(ById("flip"), "click", FlipBoard);
  Bind(ById("undo"), "click", UndoMove);
  Bind(ById("go"), "click", GoMove);
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
  PopulateOpenings();
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
