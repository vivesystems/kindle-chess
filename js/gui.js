var SQ_SIZE = 72;
var UserMove = { from: SQUARES.NO_SQ, to: SQUARES.NO_SQ };
var LastFrom = SQUARES.NO_SQ;
var LastTo = SQUARES.NO_SQ;
var searchTimer = null;
var srch_abort = BOOL.FALSE;

var MirrorFiles = [FILES.FILE_H, FILES.FILE_G, FILES.FILE_F, FILES.FILE_E, FILES.FILE_D, FILES.FILE_C, FILES.FILE_B, FILES.FILE_A];
var MirrorRanks = [RANKS.RANK_8, RANKS.RANK_7, RANKS.RANK_6, RANKS.RANK_5, RANKS.RANK_4, RANKS.RANK_3, RANKS.RANK_2, RANKS.RANK_1];

function MIRROR120(sq) {
  return FR2SQ(MirrorFiles[FilesBrd[sq]], MirrorRanks[RanksBrd[sq]]);
}

function ById(id) {
  return document.getElementById(id);
}

function HasClass(el, name) {
  return (" " + el.className + " ").indexOf(" " + name + " ") != -1;
}

function AddClass(el, name) {
  if (el && !HasClass(el, name)) el.className += " " + name;
}

function RemoveClass(el, name) {
  if (!el) return;
  var c = " " + el.className + " ";
  var n = " " + name + " ";
  while (c.indexOf(n) != -1) c = c.replace(n, " ");
  el.className = StrTrim(c);
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
  if (LegalMoveCount() != 0) return "";
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
  var panel = 150;
  SQ_SIZE = Math.floor((w - 8) / 8);
  var maxSq = Math.floor((h - panel) / 8);
  if (maxSq > 0 && maxSq < SQ_SIZE) SQ_SIZE = maxSq;
  if (SQ_SIZE > 120) SQ_SIZE = 120;
  if (SQ_SIZE < 36) SQ_SIZE = 36;
}

function DrawBoard() {
  var boardEl = ById("board");
  if (!boardEl) return;
  var boardPx = SQ_SIZE * 8;
  boardEl.style.width = boardPx + "px";
  boardEl.style.height = boardPx + "px";
  boardEl.innerHTML = "";
  var row;
  var col;
  var file;
  var rank;
  var sq;
  var div;
  var img;
  var pce;
  var light;
  var flipped = GameController.BoardFlipped == BOOL.TRUE;
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
      light = (file + rank) % 2 != 0;
      div = document.createElement("div");
      div.id = "sq-" + sq;
      div.className = "square " + (light ? "light" : "dark");
      div.style.left = col * SQ_SIZE + "px";
      div.style.top = row * SQ_SIZE + "px";
      div.style.width = SQ_SIZE + "px";
      div.style.height = SQ_SIZE + "px";
      pce = brd_pieces[sq];
      if (pce >= PIECES.wP && pce <= PIECES.bK) {
        img = document.createElement("img");
        img.src = PieceFileName(pce);
        img.width = SQ_SIZE;
        img.height = SQ_SIZE;
        img.className = "piece";
        img.draggable = false;
        div.appendChild(img);
      }
      boardEl.appendChild(div);
    }
  }
  if (LastFrom != SQUARES.NO_SQ) AddClass(ById("sq-" + LastFrom), "last");
  if (LastTo != SQUARES.NO_SQ) AddClass(ById("sq-" + LastTo), "last");
  if (UserMove.from != SQUARES.NO_SQ) {
    AddClass(ById("sq-" + UserMove.from), "selected");
    MarkHints(UserMove.from);
  }
}

function ClearHints() {
  var i;
  var el;
  for (i = 0; i < 64; i++) {
    el = ById("sq-" + SQ120(i));
    if (el) RemoveClass(el, "hint");
  }
}

function MarkHints(from) {
  GenerateMoves();
  var i;
  var mv;
  for (i = brd_moveListStart[brd_ply]; i < brd_moveListStart[brd_ply + 1]; i++) {
    mv = brd_moveList[i];
    if (FROMSQ(mv) != from) continue;
    if (MakeMove(mv) == BOOL.FALSE) continue;
    TakeMove();
    AddClass(ById("sq-" + TOSQ(mv)), "hint");
  }
}

function Deselect() {
  UserMove.from = SQUARES.NO_SQ;
  UserMove.to = SQUARES.NO_SQ;
  ClearHints();
  var i;
  var el;
  for (i = 0; i < 64; i++) {
    el = ById("sq-" + SQ120(i));
    if (el) RemoveClass(el, "selected");
  }
}

function PlayMove(move) {
  if (move == NOMOVE) return;
  MakeMove(move);
  LastFrom = FROMSQ(move);
  LastTo = TOSQ(move);
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
  var line = "";
  if (srch_fromBook == BOOL.TRUE) {
    SetStats("Book " + PrMove(move));
  } else {
    line = "d" + srch_depthFound + " " + ScoreText(srch_score) + " n" + srch_nodes;
    SetStats(line);
  }
  PlayMove(move);
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
  if (GameController.GameOver == BOOL.TRUE) return;
  if (srch_thinking == BOOL.TRUE) return;
  srch_abort = BOOL.FALSE;
  srch_thinking = BOOL.TRUE;
  SetStatus("Thinking...");
  setTimeout(StartSearch, 40);
}

function HandleSquareClick(sq) {
  if (srch_thinking == BOOL.TRUE) return;
  if (GameController.GameOver == BOOL.TRUE) return;
  if (GameController.PlayerSide != brd_side) return;
  var pce = brd_pieces[sq];
  if (UserMove.from == SQUARES.NO_SQ) {
    if (pce != PIECES.EMPTY && PieceCol[pce] == brd_side) {
      UserMove.from = sq;
      DrawBoard();
    }
    return;
  }
  if (sq == UserMove.from) {
    Deselect();
    DrawBoard();
    return;
  }
  if (pce != PIECES.EMPTY && PieceCol[pce] == brd_side) {
    UserMove.from = sq;
    DrawBoard();
    return;
  }
  var parsed = ParseMove(UserMove.from, sq);
  if (parsed == NOMOVE) {
    Deselect();
    DrawBoard();
    return;
  }
  PlayMove(parsed);
  if (GameController.GameOver != BOOL.TRUE) PreSearch();
}

function OnBoardClick(e) {
  var target = e.target || e.srcElement;
  while (target && target.id != "board" && (!target.id || target.id.indexOf("sq-") != 0)) {
    target = target.parentNode;
  }
  if (!target || !target.id || target.id.indexOf("sq-") != 0) return;
  var sq = parseInt(target.id.substring(3), 10);
  HandleSquareClick(sq);
  if (e && e.preventDefault) e.preventDefault();
  return false;
}

function NewGame() {
  if (searchTimer) {
    clearTimeout(searchTimer);
    searchTimer = null;
  }
  srch_abort = BOOL.TRUE;
  srch_thinking = BOOL.FALSE;
  srch_stop = BOOL.TRUE;
  ParseFen(START_FEN);
  LastFrom = SQUARES.NO_SQ;
  LastTo = SQUARES.NO_SQ;
  UserMove.from = SQUARES.NO_SQ;
  UserMove.to = SQUARES.NO_SQ;
  GameController.PlayerSide = GameController.BoardFlipped == BOOL.TRUE ? COLOURS.BLACK : COLOURS.WHITE;
  GameController.GameOver = BOOL.FALSE;
  DrawBoard();
  CheckAndSet();
  SetStats("");
  if (brd_side != GameController.PlayerSide) PreSearch();
}

function UndoMove() {
  if (srch_thinking == BOOL.TRUE) return;
  var take = 1;
  if (brd_hisPly >= 2) take = 2;
  if (brd_hisPly < take) take = brd_hisPly;
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
  if (srch_thinking == BOOL.TRUE) return;
  GameController.BoardFlipped = GameController.BoardFlipped == BOOL.TRUE ? BOOL.FALSE : BOOL.TRUE;
  GameController.PlayerSide = GameController.BoardFlipped == BOOL.TRUE ? COLOURS.BLACK : COLOURS.WHITE;
  DrawBoard();
  CheckAndSet();
  if (GameController.GameOver != BOOL.TRUE && brd_side != GameController.PlayerSide) PreSearch();
}

function GoMove() {
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
  LayoutBoard();
  var boardEl = ById("board");
  Bind(boardEl, "click", OnBoardClick);
  Bind(ById("new"), "click", NewGame);
  Bind(ById("flip"), "click", FlipBoard);
  Bind(ById("undo"), "click", UndoMove);
  Bind(ById("go"), "click", GoMove);
  Bind(window, "resize", function () {
    LayoutBoard();
    DrawBoard();
  });
  Bind(window, "orientationchange", function () {
    LayoutBoard();
    DrawBoard();
  });
  NewGame();
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
