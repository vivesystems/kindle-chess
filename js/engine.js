var SCRIPT_VERSION = "v2.0.3-202609171945";

var PIECES = {
  EMPTY: 0,
  wP: 1,
  wN: 2,
  wB: 3,
  wR: 4,
  wQ: 5,
  wK: 6,
  bP: 7,
  bN: 8,
  bB: 9,
  bR: 10,
  bQ: 11,
  bK: 12
};

var BRD_SQ_NUM = 120;
var MAXGAMEMOVES = 2048;
var MAXPOSITIONMOVES = 256;
var MAXDEPTH = 32;
var SEARCH_CHECK_MASK = 255;
var INFINITE = 30000;
var MATE = 29000;
var ISMATE = 28900;

var START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

var FILES = {
  FILE_A: 0,
  FILE_B: 1,
  FILE_C: 2,
  FILE_D: 3,
  FILE_E: 4,
  FILE_F: 5,
  FILE_G: 6,
  FILE_H: 7,
  FILE_NONE: 8
};

var RANKS = {
  RANK_1: 0,
  RANK_2: 1,
  RANK_3: 2,
  RANK_4: 3,
  RANK_5: 4,
  RANK_6: 5,
  RANK_7: 6,
  RANK_8: 7,
  RANK_NONE: 8
};

var COLOURS = { WHITE: 0, BLACK: 1, BOTH: 2 };

var SQUARES = {
  A1: 21,
  B1: 22,
  C1: 23,
  D1: 24,
  E1: 25,
  F1: 26,
  G1: 27,
  H1: 28,
  A8: 91,
  B8: 92,
  C8: 93,
  D8: 94,
  E8: 95,
  F8: 96,
  G8: 97,
  H8: 98,
  NO_SQ: 99,
  OFFBOARD: 100
};

var BOOL = { FALSE: 0, TRUE: 1 };

var CASTLEBIT = { WKCA: 1, WQCA: 2, BKCA: 4, BQCA: 8 };

var FilesBrd = new Array(BRD_SQ_NUM);
var RanksBrd = new Array(BRD_SQ_NUM);
var Sq120ToSq64 = new Array(BRD_SQ_NUM);
var Sq64ToSq120 = new Array(64);

var PceChar = ".PNBRQKpnbrqk";
var SideChar = "wb-";
var RankChar = "12345678";
var FileChar = "abcdefgh";

var PieceBig = [0, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1];
var PieceMaj = [0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1];
var PieceMin = [0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0];
var PieceVal = [0, 100, 320, 330, 500, 900, 50000, 100, 320, 330, 500, 900, 50000];
var PieceCol = [
  COLOURS.BOTH,
  COLOURS.WHITE,
  COLOURS.WHITE,
  COLOURS.WHITE,
  COLOURS.WHITE,
  COLOURS.WHITE,
  COLOURS.WHITE,
  COLOURS.BLACK,
  COLOURS.BLACK,
  COLOURS.BLACK,
  COLOURS.BLACK,
  COLOURS.BLACK,
  COLOURS.BLACK
];
var PiecePawn = [0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0];
var PieceKnight = [0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0];
var PieceKing = [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1];
var PieceRookQueen = [0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0];
var PieceBishopQueen = [0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0];
var PieceSlides = [0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0];

var KnDir = [-8, -19, -21, -12, 8, 19, 21, 12];
var RkDir = [-1, -10, 1, 10];
var BiDir = [-9, -11, 11, 9];
var KiDir = [-1, -10, 1, 10, -9, -11, 11, 9];

var DirNum = [0, 0, 8, 4, 4, 8, 8, 0, 8, 4, 4, 8, 8];
var PceDir = [0, 0, KnDir, BiDir, RkDir, KiDir, KiDir, 0, KnDir, BiDir, RkDir, KiDir, KiDir];
var LoopSlidePce = [PIECES.wB, PIECES.wR, PIECES.wQ, 0, PIECES.bB, PIECES.bR, PIECES.bQ, 0];
var LoopNonSlidePce = [PIECES.wN, PIECES.wK, 0, PIECES.bN, PIECES.bK, 0];
var LoopSlideIndex = [0, 4];
var LoopNonSlideIndex = [0, 3];
var Kings = [PIECES.wK, PIECES.bK];

var PieceKeys = new Array(14 * 120);
var SideKey;
var CastleKeys = new Array(16);

var Mirror64 = [
  56, 57, 58, 59, 60, 61, 62, 63, 48, 49, 50, 51, 52, 53, 54, 55, 40, 41, 42, 43, 44, 45, 46, 47, 32, 33, 34, 35, 36, 37,
  38, 39, 24, 25, 26, 27, 28, 29, 30, 31, 16, 17, 18, 19, 20, 21, 22, 23, 8, 9, 10, 11, 12, 13, 14, 15, 0, 1, 2, 3, 4, 5,
  6, 7
];

var CastlePerm = [
  15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 13, 15, 15, 15, 12, 15, 15, 14, 15,
  15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
  15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
  15, 7, 15, 15, 15, 3, 15, 15, 11, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15
];

var MFLAGEP = 0x40000;
var MFLAGPS = 0x80000;
var MFLAGCA = 0x1000000;
var MFLAGCAP = 0x7c000;
var MFLAGPROM = 0xf00000;
var NOMOVE = 0;

var HFNONE = 0;
var HFALPHA = 1;
var HFBETA = 2;
var HFEXACT = 3;

var TTSIZE = 16384;
var TTMASK = 16383;

var ttMove = new Array(TTSIZE);
var ttPosKey = new Array(TTSIZE);
var ttScore = new Array(TTSIZE);
var ttDepth = new Array(TTSIZE);
var ttFlags = new Array(TTSIZE);

function FROMSQ(m) {
  return m & 0x7f;
}
function TOSQ(m) {
  return (m >> 7) & 0x7f;
}
function CAPTURED(m) {
  return (m >> 14) & 0xf;
}
function PROMOTED(m) {
  return (m >> 20) & 0xf;
}

function PCEINDEX(pce, pceNum) {
  return pce * 10 + pceNum;
}

function FR2SQ(f, r) {
  return 21 + f + r * 10;
}

function SQ64(sq120) {
  return Sq120ToSq64[sq120];
}

function SQ120(sq64) {
  return Sq64ToSq120[sq64];
}

function MIRROR64(sq) {
  return Mirror64[sq];
}

var randSeed = 0x9d2c5680;
function RAND_32() {
  randSeed = (randSeed * 1664525 + 1013904223) | 0;
  var r1 = randSeed >>> 0;
  randSeed = (randSeed * 1664525 + 1013904223) | 0;
  return (r1 ^ ((randSeed << 16) >>> 0)) >>> 0;
}

function SQOFFBOARD(sq) {
  if (FilesBrd[sq] == SQUARES.OFFBOARD) return BOOL.TRUE;
  return BOOL.FALSE;
}

function HASH_PCE(pce, sq) {
  brd_posKey ^= PieceKeys[pce * 120 + sq];
}
function HASH_CA() {
  brd_posKey ^= CastleKeys[brd_castlePerm];
}
function HASH_SIDE() {
  brd_posKey ^= SideKey;
}
function HASH_EP() {
  brd_posKey ^= PieceKeys[brd_enPas];
}

function Now() {
  return new Date().getTime();
}

function StrTrim(s) {
  return s.replace(/^\s+|\s+$/g, "");
}

var GameController = {
  EngineSide: COLOURS.BOTH,
  PlayerSide: COLOURS.BOTH,
  BoardFlipped: BOOL.FALSE,
  GameOver: BOOL.FALSE,
  BookLoaded: BOOL.FALSE,
  GameSaved: BOOL.TRUE
};

var brd_side = COLOURS.WHITE;
var brd_pieces = new Array(BRD_SQ_NUM);
var brd_enPas = SQUARES.NO_SQ;
var brd_fiftyMove = 0;
var brd_fullMove = 1;
var brd_ply = 0;
var brd_hisPly = 0;
var brd_castlePerm = 0;
var brd_posKey = 0;
var brd_pceNum = new Array(13);
var brd_material = new Array(2);
var brd_pList = new Array(14 * 10);
var brd_history = [];
var brd_bookLines = [];
var brd_moveList = new Array(MAXDEPTH * MAXPOSITIONMOVES);
var brd_moveScores = new Array(MAXDEPTH * MAXPOSITIONMOVES);
var brd_moveListStart = new Array(MAXDEPTH);
var brd_PvArray = new Array(MAXDEPTH);
var brd_searchHistory = new Array(14 * BRD_SQ_NUM);
var brd_searchKillers = new Array(2 * MAXDEPTH);

var srch_nodes = 0;
var srch_fh = 0;
var srch_fhf = 0;
var srch_depth = MAXDEPTH;
var srch_time = 1000;
var srch_start = 0;
var srch_stop = BOOL.FALSE;
var srch_best = NOMOVE;
var srch_score = 0;
var srch_thinking = BOOL.FALSE;
var srch_fromBook = BOOL.FALSE;
var srch_depthFound = 0;
var srch_iterDepth = 1;

function BoardToFen() {
  var fenStr = "";
  var rank;
  var file;
  var sq;
  var piece;
  var emptyCount;
  for (rank = RANKS.RANK_8; rank >= RANKS.RANK_1; rank--) {
    emptyCount = 0;
    for (file = FILES.FILE_A; file <= FILES.FILE_H; file++) {
      sq = FR2SQ(file, rank);
      piece = brd_pieces[sq];
      if (piece == PIECES.EMPTY) {
        emptyCount++;
      } else {
        if (emptyCount != 0) fenStr += "" + emptyCount;
        emptyCount = 0;
        fenStr += PceChar.charAt(piece);
      }
    }
    if (emptyCount != 0) fenStr += "" + emptyCount;
    if (rank != RANKS.RANK_1) fenStr += "/";
  }
  fenStr += brd_side == COLOURS.WHITE ? " w " : " b ";
  var castle = "";
  if (brd_castlePerm & CASTLEBIT.WKCA) castle += "K";
  if (brd_castlePerm & CASTLEBIT.WQCA) castle += "Q";
  if (brd_castlePerm & CASTLEBIT.BKCA) castle += "k";
  if (brd_castlePerm & CASTLEBIT.BQCA) castle += "q";
  fenStr += castle == "" ? "-" : castle;
  fenStr += " ";
  fenStr += brd_enPas == SQUARES.NO_SQ ? "-" : PrSq(brd_enPas);
  fenStr += " ";
  fenStr += brd_fiftyMove;
  fenStr += " ";
  fenStr += brd_fullMove;
  return fenStr;
}

function printGameLine() {
  var gameLine = "";
  var moveNum;
  for (moveNum = 0; moveNum < brd_hisPly; ++moveNum) {
    if (brd_history[moveNum].move != NOMOVE) {
      gameLine += PrMove(brd_history[moveNum].move) + " ";
    }
  }
  return StrTrim(gameLine);
}

function LineMatch(bookLine, gameLine) {
  var len;
  for (len = 0; len < gameLine.length; ++len) {
    if (len >= bookLine.length) return BOOL.FALSE;
    if (gameLine.charAt(len) != bookLine.charAt(len)) return BOOL.FALSE;
  }
  return BOOL.TRUE;
}

function BookMove() {
  var gameLine = printGameLine();
  var bookMoves = [];
  var lengthOfLineHack = gameLine.length;
  if (gameLine.length == 0) lengthOfLineHack--;
  var bookLineNum;
  for (bookLineNum = 0; bookLineNum < brd_bookLines.length; ++bookLineNum) {
    if (LineMatch(brd_bookLines[bookLineNum], gameLine) == BOOL.TRUE) {
      var move = brd_bookLines[bookLineNum].substr(lengthOfLineHack + 1, 4);
      if (move.length == 4) {
        var from = SqFromAlg(move.substr(0, 2));
        var to = SqFromAlg(move.substr(2, 2));
        var internalMove = ParseMove(from, to);
        if (internalMove != NOMOVE) bookMoves.push(internalMove);
      }
    }
  }
  if (bookMoves.length == 0) return NOMOVE;
  var num = Math.floor(Math.random() * bookMoves.length);
  return bookMoves[num];
}

function UpdateListsMaterial() {
  var piece;
  var sq;
  var index;
  var colour;
  for (index = 0; index < BRD_SQ_NUM; ++index) {
    sq = index;
    piece = brd_pieces[index];
    if (piece != SQUARES.OFFBOARD && piece != PIECES.EMPTY) {
      colour = PieceCol[piece];
      brd_material[colour] += PieceVal[piece];
      brd_pList[PCEINDEX(piece, brd_pceNum[piece])] = sq;
      brd_pceNum[piece]++;
    }
  }
}

function GeneratePosKey() {
  var sq = 0;
  var finalKey = 0;
  var piece = PIECES.EMPTY;
  for (sq = 0; sq < BRD_SQ_NUM; ++sq) {
    piece = brd_pieces[sq];
    if (piece != PIECES.EMPTY && piece != SQUARES.OFFBOARD) {
      finalKey ^= PieceKeys[piece * 120 + sq];
    }
  }
  if (brd_side == COLOURS.WHITE) finalKey ^= SideKey;
  if (brd_enPas != SQUARES.NO_SQ) finalKey ^= PieceKeys[brd_enPas];
  finalKey ^= CastleKeys[brd_castlePerm];
  return finalKey;
}

function ResetBoard() {
  var index;
  for (index = 0; index < BRD_SQ_NUM; ++index) {
    brd_pieces[index] = SQUARES.OFFBOARD;
  }
  for (index = 0; index < 64; ++index) {
    brd_pieces[SQ120(index)] = PIECES.EMPTY;
  }
  for (index = 0; index < 14 * 10; ++index) {
    brd_pList[index] = PIECES.EMPTY;
  }
  for (index = 0; index < 2; ++index) {
    brd_material[index] = 0;
  }
  for (index = 0; index < 13; ++index) {
    brd_pceNum[index] = 0;
  }
  brd_side = COLOURS.BOTH;
  brd_enPas = SQUARES.NO_SQ;
  brd_fiftyMove = 0;
  brd_fullMove = 1;
  brd_ply = 0;
  brd_hisPly = 0;
  brd_castlePerm = 0;
  brd_posKey = 0;
  brd_moveListStart[brd_ply] = 0;
}

function ParseFen(fen) {
  ResetBoard();
  if (!fen) fen = START_FEN;
  fen = StrTrim(fen);
  if (fen == "") fen = START_FEN;
  var tokens = fen.split(/\s+/);
  var ranks = tokens[0].split("/");
  var rank;
  var file;
  var i;
  var ch;
  var piece;
  var sq;
  for (rank = 0; rank < 8; rank++) {
    file = 0;
    var row = ranks[rank] || "";
    for (i = 0; i < row.length; i++) {
      ch = row.charAt(i);
      if (ch >= "1" && ch <= "8") {
        file += ch.charCodeAt(0) - 48;
      } else {
        piece = PceChar.indexOf(ch);
        if (piece <= 0 || file > 7) continue;
        sq = FR2SQ(file, 7 - rank);
        brd_pieces[sq] = piece;
        file++;
      }
    }
  }
  brd_side = tokens.length > 1 && tokens[1] == "b" ? COLOURS.BLACK : COLOURS.WHITE;
  brd_castlePerm = 0;
  if (tokens.length > 2 && tokens[2] != "-") {
    if (tokens[2].indexOf("K") != -1) brd_castlePerm |= CASTLEBIT.WKCA;
    if (tokens[2].indexOf("Q") != -1) brd_castlePerm |= CASTLEBIT.WQCA;
    if (tokens[2].indexOf("k") != -1) brd_castlePerm |= CASTLEBIT.BKCA;
    if (tokens[2].indexOf("q") != -1) brd_castlePerm |= CASTLEBIT.BQCA;
  }
  brd_enPas = SQUARES.NO_SQ;
  if (tokens.length > 3 && tokens[3] != "-") {
    brd_enPas = SqFromAlg(tokens[3]);
  }
  brd_fiftyMove = 0;
  if (tokens.length > 4) {
    brd_fiftyMove = parseInt(tokens[4], 10);
    if (!brd_fiftyMove) brd_fiftyMove = 0;
  }
  if (tokens.length > 5) {
    brd_fullMove = parseInt(tokens[5], 10);
    if (!brd_fullMove || brd_fullMove < 1) brd_fullMove = 1;
  }
  brd_posKey = GeneratePosKey();
  UpdateListsMaterial();
}

function SqAttacked(sq, side) {
  var pce;
  var t_sq;
  var index;
  var dir;
  if (side == COLOURS.WHITE) {
    if (brd_pieces[sq - 11] == PIECES.wP || brd_pieces[sq - 9] == PIECES.wP) return BOOL.TRUE;
  } else {
    if (brd_pieces[sq + 11] == PIECES.bP || brd_pieces[sq + 9] == PIECES.bP) return BOOL.TRUE;
  }
  for (index = 0; index < 8; ++index) {
    pce = brd_pieces[sq + KnDir[index]];
    if (pce != SQUARES.OFFBOARD && PieceKnight[pce] == BOOL.TRUE && PieceCol[pce] == side) return BOOL.TRUE;
  }
  for (index = 0; index < 4; ++index) {
    dir = RkDir[index];
    t_sq = sq + dir;
    pce = brd_pieces[t_sq];
    while (pce != SQUARES.OFFBOARD) {
      if (pce != PIECES.EMPTY) {
        if (PieceRookQueen[pce] == BOOL.TRUE && PieceCol[pce] == side) return BOOL.TRUE;
        break;
      }
      t_sq += dir;
      pce = brd_pieces[t_sq];
    }
  }
  for (index = 0; index < 4; ++index) {
    dir = BiDir[index];
    t_sq = sq + dir;
    pce = brd_pieces[t_sq];
    while (pce != SQUARES.OFFBOARD) {
      if (pce != PIECES.EMPTY) {
        if (PieceBishopQueen[pce] == BOOL.TRUE && PieceCol[pce] == side) return BOOL.TRUE;
        break;
      }
      t_sq += dir;
      pce = brd_pieces[t_sq];
    }
  }
  for (index = 0; index < 8; ++index) {
    pce = brd_pieces[sq + KiDir[index]];
    if (pce != SQUARES.OFFBOARD && PieceKing[pce] == BOOL.TRUE && PieceCol[pce] == side) return BOOL.TRUE;
  }
  return BOOL.FALSE;
}

function SqFromAlg(moveAlg) {
  if (!moveAlg || moveAlg.length != 2) return SQUARES.NO_SQ;
  if (moveAlg.charAt(0) > "h" || moveAlg.charAt(0) < "a") return SQUARES.NO_SQ;
  if (moveAlg.charAt(1) > "8" || moveAlg.charAt(1) < "1") return SQUARES.NO_SQ;
  var file = moveAlg.charCodeAt(0) - "a".charCodeAt(0);
  var rank = moveAlg.charCodeAt(1) - "1".charCodeAt(0);
  return FR2SQ(file, rank);
}

function PrSq(sq) {
  var file = FilesBrd[sq];
  var rank = RanksBrd[sq];
  if (file < 0 || file > 7 || rank < 0 || rank > 7) return "-";
  return String.fromCharCode("a".charCodeAt(0) + file) + String.fromCharCode("1".charCodeAt(0) + rank);
}

function PrMove(move) {
  if (move == NOMOVE) return "none";
  var ff = FilesBrd[FROMSQ(move)];
  var rf = RanksBrd[FROMSQ(move)];
  var ft = FilesBrd[TOSQ(move)];
  var rt = RanksBrd[TOSQ(move)];
  var mvStr =
    String.fromCharCode("a".charCodeAt(0) + ff) +
    String.fromCharCode("1".charCodeAt(0) + rf) +
    String.fromCharCode("a".charCodeAt(0) + ft) +
    String.fromCharCode("1".charCodeAt(0) + rt);
  var promoted = PROMOTED(move);
  if (promoted != PIECES.EMPTY) {
    var pchar = "q";
    if (PieceKnight[promoted] == BOOL.TRUE) pchar = "n";
    else if (PieceRookQueen[promoted] == BOOL.TRUE && PieceBishopQueen[promoted] == BOOL.FALSE) pchar = "r";
    else if (PieceRookQueen[promoted] == BOOL.FALSE && PieceBishopQueen[promoted] == BOOL.TRUE) pchar = "b";
    mvStr += pchar;
  }
  return mvStr;
}

function ParseMove(from, to) {
  GenerateMoves();
  var Move = NOMOVE;
  var PromPce = PIECES.EMPTY;
  var found = BOOL.FALSE;
  var index;
  for (index = brd_moveListStart[brd_ply]; index < brd_moveListStart[brd_ply + 1]; ++index) {
    Move = brd_moveList[index];
    if (FROMSQ(Move) == from && TOSQ(Move) == to) {
      PromPce = PROMOTED(Move);
      if (PromPce != PIECES.EMPTY) {
        if ((PromPce == PIECES.wQ && brd_side == COLOURS.WHITE) || (PromPce == PIECES.bQ && brd_side == COLOURS.BLACK)) {
          found = BOOL.TRUE;
          break;
        }
        continue;
      }
      found = BOOL.TRUE;
      break;
    }
  }
  if (found != BOOL.FALSE) {
    if (MakeMove(Move) == BOOL.FALSE) return NOMOVE;
    TakeMove();
    return Move;
  }
  return NOMOVE;
}

var VictimScore = [0, 100, 200, 300, 400, 500, 600, 100, 200, 300, 400, 500, 600];
var MvvLvaScores = new Array(14 * 14);

function InitMvvLva() {
  var Attacker;
  var Victim;
  for (Attacker = PIECES.wP; Attacker <= PIECES.bK; ++Attacker) {
    for (Victim = PIECES.wP; Victim <= PIECES.bK; ++Victim) {
      MvvLvaScores[Victim * 14 + Attacker] = VictimScore[Victim] + 6 - VictimScore[Attacker] / 100;
    }
  }
}

function MOVE(from, to, captured, promoted, flag) {
  return from | (to << 7) | (captured << 14) | (promoted << 20) | flag;
}

function MoveExists(move) {
  GenerateMoves();
  var index;
  var moveFound = NOMOVE;
  for (index = brd_moveListStart[brd_ply]; index < brd_moveListStart[brd_ply + 1]; ++index) {
    moveFound = brd_moveList[index];
    if (MakeMove(moveFound) == BOOL.FALSE) continue;
    TakeMove();
    if (move == moveFound) return BOOL.TRUE;
  }
  return BOOL.FALSE;
}

function AddCaptureMove(move) {
  brd_moveList[brd_moveListStart[brd_ply + 1]] = move;
  brd_moveScores[brd_moveListStart[brd_ply + 1]++] = MvvLvaScores[CAPTURED(move) * 14 + brd_pieces[FROMSQ(move)]] + 1000000;
}

function AddQuietMove(move) {
  brd_moveList[brd_moveListStart[brd_ply + 1]] = move;
  if (brd_searchKillers[brd_ply] == move) {
    brd_moveScores[brd_moveListStart[brd_ply + 1]] = 900000;
  } else if (brd_searchKillers[MAXDEPTH + brd_ply] == move) {
    brd_moveScores[brd_moveListStart[brd_ply + 1]] = 800000;
  } else {
    brd_moveScores[brd_moveListStart[brd_ply + 1]] = brd_searchHistory[brd_pieces[FROMSQ(move)] * BRD_SQ_NUM + TOSQ(move)];
  }
  brd_moveListStart[brd_ply + 1]++;
}

function AddEnPassantMove(move) {
  brd_moveList[brd_moveListStart[brd_ply + 1]] = move;
  brd_moveScores[brd_moveListStart[brd_ply + 1]++] = 105 + 1000000;
}

function AddWhitePawnCaptureMove(from, to, cap) {
  if (RanksBrd[from] == RANKS.RANK_7) {
    AddCaptureMove(MOVE(from, to, cap, PIECES.wQ, 0));
    AddCaptureMove(MOVE(from, to, cap, PIECES.wR, 0));
    AddCaptureMove(MOVE(from, to, cap, PIECES.wB, 0));
    AddCaptureMove(MOVE(from, to, cap, PIECES.wN, 0));
  } else {
    AddCaptureMove(MOVE(from, to, cap, PIECES.EMPTY, 0));
  }
}

function AddWhitePawnQuietMove(from, to) {
  if (RanksBrd[from] == RANKS.RANK_7) {
    AddQuietMove(MOVE(from, to, PIECES.EMPTY, PIECES.wQ, 0));
    AddQuietMove(MOVE(from, to, PIECES.EMPTY, PIECES.wR, 0));
    AddQuietMove(MOVE(from, to, PIECES.EMPTY, PIECES.wB, 0));
    AddQuietMove(MOVE(from, to, PIECES.EMPTY, PIECES.wN, 0));
  } else {
    AddQuietMove(MOVE(from, to, PIECES.EMPTY, PIECES.EMPTY, 0));
  }
}

function AddBlackPawnCaptureMove(from, to, cap) {
  if (RanksBrd[from] == RANKS.RANK_2) {
    AddCaptureMove(MOVE(from, to, cap, PIECES.bQ, 0));
    AddCaptureMove(MOVE(from, to, cap, PIECES.bR, 0));
    AddCaptureMove(MOVE(from, to, cap, PIECES.bB, 0));
    AddCaptureMove(MOVE(from, to, cap, PIECES.bN, 0));
  } else {
    AddCaptureMove(MOVE(from, to, cap, PIECES.EMPTY, 0));
  }
}

function AddBlackPawnQuietMove(from, to) {
  if (RanksBrd[from] == RANKS.RANK_2) {
    AddQuietMove(MOVE(from, to, PIECES.EMPTY, PIECES.bQ, 0));
    AddQuietMove(MOVE(from, to, PIECES.EMPTY, PIECES.bR, 0));
    AddQuietMove(MOVE(from, to, PIECES.EMPTY, PIECES.bB, 0));
    AddQuietMove(MOVE(from, to, PIECES.EMPTY, PIECES.bN, 0));
  } else {
    AddQuietMove(MOVE(from, to, PIECES.EMPTY, PIECES.EMPTY, 0));
  }
}

function CanEnPassant(sq, side) {
  if (brd_enPas == SQUARES.NO_SQ || brd_pieces[brd_enPas] != PIECES.EMPTY) return BOOL.FALSE;
  if (side == COLOURS.WHITE) {
    return brd_pieces[brd_enPas - 10] == PIECES.bP && (sq + 9 == brd_enPas || sq + 11 == brd_enPas) ? BOOL.TRUE : BOOL.FALSE;
  }
  return brd_pieces[brd_enPas + 10] == PIECES.wP && (sq - 9 == brd_enPas || sq - 11 == brd_enPas) ? BOOL.TRUE : BOOL.FALSE;
}

function GenerateMoves() {
  brd_moveListStart[brd_ply + 1] = brd_moveListStart[brd_ply];
  var pceType;
  var pceNum;
  var pceIndex;
  var pce;
  var sq;
  var t_sq;
  var index;
  var dir;
  if (brd_side == COLOURS.WHITE) {
    pceType = PIECES.wP;
    for (pceNum = 0; pceNum < brd_pceNum[pceType]; ++pceNum) {
      sq = brd_pList[PCEINDEX(pceType, pceNum)];
      if (brd_pieces[sq + 10] == PIECES.EMPTY) {
        AddWhitePawnQuietMove(sq, sq + 10);
        if (RanksBrd[sq] == RANKS.RANK_2 && brd_pieces[sq + 20] == PIECES.EMPTY) {
          AddQuietMove(MOVE(sq, sq + 20, PIECES.EMPTY, PIECES.EMPTY, MFLAGPS));
        }
      }
      if (SQOFFBOARD(sq + 9) == BOOL.FALSE && PieceCol[brd_pieces[sq + 9]] == COLOURS.BLACK) {
        AddWhitePawnCaptureMove(sq, sq + 9, brd_pieces[sq + 9]);
      }
      if (SQOFFBOARD(sq + 11) == BOOL.FALSE && PieceCol[brd_pieces[sq + 11]] == COLOURS.BLACK) {
        AddWhitePawnCaptureMove(sq, sq + 11, brd_pieces[sq + 11]);
      }
      if (CanEnPassant(sq, COLOURS.WHITE) == BOOL.TRUE) {
        if (sq + 9 == brd_enPas) AddEnPassantMove(MOVE(sq, sq + 9, PIECES.EMPTY, PIECES.EMPTY, MFLAGEP));
        if (sq + 11 == brd_enPas) AddEnPassantMove(MOVE(sq, sq + 11, PIECES.EMPTY, PIECES.EMPTY, MFLAGEP));
      }
    }
    if (brd_castlePerm & CASTLEBIT.WKCA) {
      if (brd_pieces[SQUARES.F1] == PIECES.EMPTY && brd_pieces[SQUARES.G1] == PIECES.EMPTY) {
        if (
          brd_pieces[SQUARES.E1] == PIECES.wK &&
          brd_pieces[SQUARES.H1] == PIECES.wR &&
          SqAttacked(SQUARES.E1, COLOURS.BLACK) == BOOL.FALSE &&
          SqAttacked(SQUARES.F1, COLOURS.BLACK) == BOOL.FALSE
        ) {
          AddQuietMove(MOVE(SQUARES.E1, SQUARES.G1, PIECES.EMPTY, PIECES.EMPTY, MFLAGCA));
        }
      }
    }
    if (brd_castlePerm & CASTLEBIT.WQCA) {
      if (
        brd_pieces[SQUARES.D1] == PIECES.EMPTY &&
        brd_pieces[SQUARES.C1] == PIECES.EMPTY &&
        brd_pieces[SQUARES.B1] == PIECES.EMPTY
      ) {
        if (
          brd_pieces[SQUARES.E1] == PIECES.wK &&
          brd_pieces[SQUARES.A1] == PIECES.wR &&
          SqAttacked(SQUARES.E1, COLOURS.BLACK) == BOOL.FALSE &&
          SqAttacked(SQUARES.D1, COLOURS.BLACK) == BOOL.FALSE
        ) {
          AddQuietMove(MOVE(SQUARES.E1, SQUARES.C1, PIECES.EMPTY, PIECES.EMPTY, MFLAGCA));
        }
      }
    }
  } else {
    pceType = PIECES.bP;
    for (pceNum = 0; pceNum < brd_pceNum[pceType]; ++pceNum) {
      sq = brd_pList[PCEINDEX(pceType, pceNum)];
      if (brd_pieces[sq - 10] == PIECES.EMPTY) {
        AddBlackPawnQuietMove(sq, sq - 10);
        if (RanksBrd[sq] == RANKS.RANK_7 && brd_pieces[sq - 20] == PIECES.EMPTY) {
          AddQuietMove(MOVE(sq, sq - 20, PIECES.EMPTY, PIECES.EMPTY, MFLAGPS));
        }
      }
      if (SQOFFBOARD(sq - 9) == BOOL.FALSE && PieceCol[brd_pieces[sq - 9]] == COLOURS.WHITE) {
        AddBlackPawnCaptureMove(sq, sq - 9, brd_pieces[sq - 9]);
      }
      if (SQOFFBOARD(sq - 11) == BOOL.FALSE && PieceCol[brd_pieces[sq - 11]] == COLOURS.WHITE) {
        AddBlackPawnCaptureMove(sq, sq - 11, brd_pieces[sq - 11]);
      }
      if (CanEnPassant(sq, COLOURS.BLACK) == BOOL.TRUE) {
        if (sq - 9 == brd_enPas) AddEnPassantMove(MOVE(sq, sq - 9, PIECES.EMPTY, PIECES.EMPTY, MFLAGEP));
        if (sq - 11 == brd_enPas) AddEnPassantMove(MOVE(sq, sq - 11, PIECES.EMPTY, PIECES.EMPTY, MFLAGEP));
      }
    }
    if (brd_castlePerm & CASTLEBIT.BKCA) {
      if (brd_pieces[SQUARES.F8] == PIECES.EMPTY && brd_pieces[SQUARES.G8] == PIECES.EMPTY) {
        if (
          brd_pieces[SQUARES.E8] == PIECES.bK &&
          brd_pieces[SQUARES.H8] == PIECES.bR &&
          SqAttacked(SQUARES.E8, COLOURS.WHITE) == BOOL.FALSE &&
          SqAttacked(SQUARES.F8, COLOURS.WHITE) == BOOL.FALSE
        ) {
          AddQuietMove(MOVE(SQUARES.E8, SQUARES.G8, PIECES.EMPTY, PIECES.EMPTY, MFLAGCA));
        }
      }
    }
    if (brd_castlePerm & CASTLEBIT.BQCA) {
      if (
        brd_pieces[SQUARES.D8] == PIECES.EMPTY &&
        brd_pieces[SQUARES.C8] == PIECES.EMPTY &&
        brd_pieces[SQUARES.B8] == PIECES.EMPTY
      ) {
        if (
          brd_pieces[SQUARES.E8] == PIECES.bK &&
          brd_pieces[SQUARES.A8] == PIECES.bR &&
          SqAttacked(SQUARES.E8, COLOURS.WHITE) == BOOL.FALSE &&
          SqAttacked(SQUARES.D8, COLOURS.WHITE) == BOOL.FALSE
        ) {
          AddQuietMove(MOVE(SQUARES.E8, SQUARES.C8, PIECES.EMPTY, PIECES.EMPTY, MFLAGCA));
        }
      }
    }
  }

  pceIndex = LoopSlideIndex[brd_side];
  pce = LoopSlidePce[pceIndex++];
  while (pce != 0) {
    for (pceNum = 0; pceNum < brd_pceNum[pce]; ++pceNum) {
      sq = brd_pList[PCEINDEX(pce, pceNum)];
      for (index = 0; index < DirNum[pce]; ++index) {
        dir = PceDir[pce][index];
        t_sq = sq + dir;
        while (SQOFFBOARD(t_sq) == BOOL.FALSE) {
          if (brd_pieces[t_sq] != PIECES.EMPTY) {
            if ((PieceCol[brd_pieces[t_sq]] == brd_side) ^ 1) {
              AddCaptureMove(MOVE(sq, t_sq, brd_pieces[t_sq], PIECES.EMPTY, 0));
            }
            break;
          }
          AddQuietMove(MOVE(sq, t_sq, PIECES.EMPTY, PIECES.EMPTY, 0));
          t_sq += dir;
        }
      }
    }
    pce = LoopSlidePce[pceIndex++];
  }

  pceIndex = LoopNonSlideIndex[brd_side];
  pce = LoopNonSlidePce[pceIndex++];
  while (pce != 0) {
    for (pceNum = 0; pceNum < brd_pceNum[pce]; ++pceNum) {
      sq = brd_pList[PCEINDEX(pce, pceNum)];
      for (index = 0; index < DirNum[pce]; ++index) {
        dir = PceDir[pce][index];
        t_sq = sq + dir;
        if (SQOFFBOARD(t_sq) == BOOL.TRUE) continue;
        if (brd_pieces[t_sq] != PIECES.EMPTY) {
          if ((PieceCol[brd_pieces[t_sq]] == brd_side) ^ 1) {
            AddCaptureMove(MOVE(sq, t_sq, brd_pieces[t_sq], PIECES.EMPTY, 0));
          }
          continue;
        }
        AddQuietMove(MOVE(sq, t_sq, PIECES.EMPTY, PIECES.EMPTY, 0));
      }
    }
    pce = LoopNonSlidePce[pceIndex++];
  }
}

function GenerateCaptures() {
  brd_moveListStart[brd_ply + 1] = brd_moveListStart[brd_ply];
  var pceNum;
  var pceIndex;
  var pce;
  var sq;
  var t_sq;
  var index;
  var dir;
  if (brd_side == COLOURS.WHITE) {
    for (pceNum = 0; pceNum < brd_pceNum[PIECES.wP]; ++pceNum) {
      sq = brd_pList[PCEINDEX(PIECES.wP, pceNum)];
      if (SQOFFBOARD(sq + 9) == BOOL.FALSE && PieceCol[brd_pieces[sq + 9]] == COLOURS.BLACK) {
        AddWhitePawnCaptureMove(sq, sq + 9, brd_pieces[sq + 9]);
      }
      if (SQOFFBOARD(sq + 11) == BOOL.FALSE && PieceCol[brd_pieces[sq + 11]] == COLOURS.BLACK) {
        AddWhitePawnCaptureMove(sq, sq + 11, brd_pieces[sq + 11]);
      }
      if (CanEnPassant(sq, COLOURS.WHITE) == BOOL.TRUE) {
        if (sq + 9 == brd_enPas) AddEnPassantMove(MOVE(sq, sq + 9, PIECES.EMPTY, PIECES.EMPTY, MFLAGEP));
        if (sq + 11 == brd_enPas) AddEnPassantMove(MOVE(sq, sq + 11, PIECES.EMPTY, PIECES.EMPTY, MFLAGEP));
      }
    }
  } else {
    for (pceNum = 0; pceNum < brd_pceNum[PIECES.bP]; ++pceNum) {
      sq = brd_pList[PCEINDEX(PIECES.bP, pceNum)];
      if (SQOFFBOARD(sq - 9) == BOOL.FALSE && PieceCol[brd_pieces[sq - 9]] == COLOURS.WHITE) {
        AddBlackPawnCaptureMove(sq, sq - 9, brd_pieces[sq - 9]);
      }
      if (SQOFFBOARD(sq - 11) == BOOL.FALSE && PieceCol[brd_pieces[sq - 11]] == COLOURS.WHITE) {
        AddBlackPawnCaptureMove(sq, sq - 11, brd_pieces[sq - 11]);
      }
      if (CanEnPassant(sq, COLOURS.BLACK) == BOOL.TRUE) {
        if (sq - 9 == brd_enPas) AddEnPassantMove(MOVE(sq, sq - 9, PIECES.EMPTY, PIECES.EMPTY, MFLAGEP));
        if (sq - 11 == brd_enPas) AddEnPassantMove(MOVE(sq, sq - 11, PIECES.EMPTY, PIECES.EMPTY, MFLAGEP));
      }
    }
  }

  pceIndex = LoopSlideIndex[brd_side];
  pce = LoopSlidePce[pceIndex++];
  while (pce != 0) {
    for (pceNum = 0; pceNum < brd_pceNum[pce]; ++pceNum) {
      sq = brd_pList[PCEINDEX(pce, pceNum)];
      for (index = 0; index < DirNum[pce]; ++index) {
        dir = PceDir[pce][index];
        t_sq = sq + dir;
        while (SQOFFBOARD(t_sq) == BOOL.FALSE) {
          if (brd_pieces[t_sq] != PIECES.EMPTY) {
            if ((PieceCol[brd_pieces[t_sq]] == brd_side) ^ 1) {
              AddCaptureMove(MOVE(sq, t_sq, brd_pieces[t_sq], PIECES.EMPTY, 0));
            }
            break;
          }
          t_sq += dir;
        }
      }
    }
    pce = LoopSlidePce[pceIndex++];
  }

  pceIndex = LoopNonSlideIndex[brd_side];
  pce = LoopNonSlidePce[pceIndex++];
  while (pce != 0) {
    for (pceNum = 0; pceNum < brd_pceNum[pce]; ++pceNum) {
      sq = brd_pList[PCEINDEX(pce, pceNum)];
      for (index = 0; index < DirNum[pce]; ++index) {
        dir = PceDir[pce][index];
        t_sq = sq + dir;
        if (SQOFFBOARD(t_sq) == BOOL.TRUE) continue;
        if (brd_pieces[t_sq] != PIECES.EMPTY) {
          if ((PieceCol[brd_pieces[t_sq]] == brd_side) ^ 1) {
            AddCaptureMove(MOVE(sq, t_sq, brd_pieces[t_sq], PIECES.EMPTY, 0));
          }
        }
      }
    }
    pce = LoopNonSlidePce[pceIndex++];
  }
}

function ClearPiece(sq) {
  var pce = brd_pieces[sq];
  var col = PieceCol[pce];
  var index = 0;
  var t_pceNum = -1;
  HASH_PCE(pce, sq);
  brd_pieces[sq] = PIECES.EMPTY;
  brd_material[col] -= PieceVal[pce];
  for (index = 0; index < brd_pceNum[pce]; ++index) {
    if (brd_pList[PCEINDEX(pce, index)] == sq) {
      t_pceNum = index;
      break;
    }
  }
  brd_pceNum[pce]--;
  brd_pList[PCEINDEX(pce, t_pceNum)] = brd_pList[PCEINDEX(pce, brd_pceNum[pce])];
}

function AddPiece(sq, pce) {
  var col = PieceCol[pce];
  HASH_PCE(pce, sq);
  brd_pieces[sq] = pce;
  brd_material[col] += PieceVal[pce];
  brd_pList[PCEINDEX(pce, brd_pceNum[pce])] = sq;
  brd_pceNum[pce]++;
}

function MovePiece(from, to) {
  var index = 0;
  var pce = brd_pieces[from];
  HASH_PCE(pce, from);
  brd_pieces[from] = PIECES.EMPTY;
  HASH_PCE(pce, to);
  brd_pieces[to] = pce;
  for (index = 0; index < brd_pceNum[pce]; ++index) {
    if (brd_pList[PCEINDEX(pce, index)] == from) {
      brd_pList[PCEINDEX(pce, index)] = to;
      break;
    }
  }
}

function MakeMove(move) {
  var from = FROMSQ(move);
  var to = TOSQ(move);
  var side = brd_side;
  brd_history[brd_hisPly].posKey = brd_posKey;
  if ((move & MFLAGEP) != 0) {
    if (side == COLOURS.WHITE) ClearPiece(to - 10);
    else ClearPiece(to + 10);
  } else if ((move & MFLAGCA) != 0) {
    switch (to) {
      case SQUARES.C1:
        MovePiece(SQUARES.A1, SQUARES.D1);
        break;
      case SQUARES.C8:
        MovePiece(SQUARES.A8, SQUARES.D8);
        break;
      case SQUARES.G1:
        MovePiece(SQUARES.H1, SQUARES.F1);
        break;
      case SQUARES.G8:
        MovePiece(SQUARES.H8, SQUARES.F8);
        break;
      default:
        break;
    }
  }
  if (brd_enPas != SQUARES.NO_SQ) HASH_EP();
  HASH_CA();
  brd_history[brd_hisPly].move = move;
  brd_history[brd_hisPly].fiftyMove = brd_fiftyMove;
  brd_history[brd_hisPly].fullMove = brd_fullMove;
  brd_history[brd_hisPly].enPas = brd_enPas;
  brd_history[brd_hisPly].castlePerm = brd_castlePerm;
  brd_castlePerm &= CastlePerm[from];
  brd_castlePerm &= CastlePerm[to];
  brd_enPas = SQUARES.NO_SQ;
  HASH_CA();
  var captured = CAPTURED(move);
  brd_fiftyMove++;
  if (captured != PIECES.EMPTY) {
    ClearPiece(to);
    brd_fiftyMove = 0;
  }
  brd_hisPly++;
  brd_ply++;
  if (side == COLOURS.BLACK) brd_fullMove++;
  if (PiecePawn[brd_pieces[from]] == BOOL.TRUE) {
    brd_fiftyMove = 0;
    if ((move & MFLAGPS) != 0) {
      if (side == COLOURS.WHITE) brd_enPas = from + 10;
      else brd_enPas = from - 10;
      HASH_EP();
    }
  }
  MovePiece(from, to);
  var prPce = PROMOTED(move);
  if (prPce != PIECES.EMPTY) {
    ClearPiece(to);
    AddPiece(to, prPce);
  }
  brd_side ^= 1;
  HASH_SIDE();
  if (SqAttacked(brd_pList[PCEINDEX(Kings[side], 0)], brd_side)) {
    TakeMove();
    return BOOL.FALSE;
  }
  return BOOL.TRUE;
}

function TakeMove() {
  brd_hisPly--;
  brd_ply--;
  var move = brd_history[brd_hisPly].move;
  var from = FROMSQ(move);
  var to = TOSQ(move);
  if (brd_enPas != SQUARES.NO_SQ) HASH_EP();
  HASH_CA();
  brd_castlePerm = brd_history[brd_hisPly].castlePerm;
  brd_fiftyMove = brd_history[brd_hisPly].fiftyMove;
  brd_fullMove = brd_history[brd_hisPly].fullMove;
  brd_enPas = brd_history[brd_hisPly].enPas;
  if (brd_enPas != SQUARES.NO_SQ) HASH_EP();
  HASH_CA();
  brd_side ^= 1;
  HASH_SIDE();
  if ((MFLAGEP & move) != 0) {
    if (brd_side == COLOURS.WHITE) AddPiece(to - 10, PIECES.bP);
    else AddPiece(to + 10, PIECES.wP);
  } else if ((MFLAGCA & move) != 0) {
    switch (to) {
      case SQUARES.C1:
        MovePiece(SQUARES.D1, SQUARES.A1);
        break;
      case SQUARES.C8:
        MovePiece(SQUARES.D8, SQUARES.A8);
        break;
      case SQUARES.G1:
        MovePiece(SQUARES.F1, SQUARES.H1);
        break;
      case SQUARES.G8:
        MovePiece(SQUARES.F8, SQUARES.H8);
        break;
      default:
        break;
    }
  }
  MovePiece(to, from);
  var captured = CAPTURED(move);
  if (captured != PIECES.EMPTY) AddPiece(to, captured);
  if (PROMOTED(move) != PIECES.EMPTY) {
    ClearPiece(from);
    AddPiece(from, PieceCol[PROMOTED(move)] == COLOURS.WHITE ? PIECES.wP : PIECES.bP);
  }
}

function MakeNullMove() {
  brd_moveListStart[brd_ply + 1] = brd_moveListStart[brd_ply];
  brd_history[brd_hisPly].posKey = brd_posKey;
  brd_history[brd_hisPly].move = NOMOVE;
  brd_history[brd_hisPly].fiftyMove = brd_fiftyMove;
  brd_history[brd_hisPly].fullMove = brd_fullMove;
  brd_history[brd_hisPly].enPas = brd_enPas;
  brd_history[brd_hisPly].castlePerm = brd_castlePerm;
  if (brd_enPas != SQUARES.NO_SQ) HASH_EP();
  brd_enPas = SQUARES.NO_SQ;
  brd_side ^= 1;
  HASH_SIDE();
  brd_hisPly++;
  brd_ply++;
}

function TakeNullMove() {
  brd_hisPly--;
  brd_ply--;
  brd_side ^= 1;
  HASH_SIDE();
  brd_castlePerm = brd_history[brd_hisPly].castlePerm;
  brd_fiftyMove = brd_history[brd_hisPly].fiftyMove;
  brd_fullMove = brd_history[brd_hisPly].fullMove;
  brd_enPas = brd_history[brd_hisPly].enPas;
  if (brd_enPas != SQUARES.NO_SQ) HASH_EP();
}

var RookOpenFile = 10;
var RookSemiOpenFile = 5;
var QueenOpenFile = 5;
var QueenSemiOpenFile = 3;
var BishopPair = 30;
var PawnIsolated = -10;
var PawnDoubled = -12;
var RookOnSeventh = 16;
var PawnPassed = [0, 5, 10, 20, 35, 60, 100, 200];

var PawnRanksWhite = new Array(10);
var PawnRanksBlack = new Array(10);
var PawnCountWhite = new Array(10);
var PawnCountBlack = new Array(10);

var PawnTable = [
  0, 0, 0, 0, 0, 0, 0, 0, 10, 10, 0, -10, -10, 0, 10, 10, 5, 0, 0, 5, 5, 0, 0, 5, 0, 0, 10, 20, 20, 10, 0, 0, 5, 5, 5, 10,
  10, 5, 5, 5, 10, 10, 10, 20, 20, 10, 10, 10, 20, 20, 20, 30, 30, 20, 20, 20, 0, 0, 0, 0, 0, 0, 0, 0
];

var KnightTable = [
  0, -10, 0, 0, 0, 0, -10, 0, 0, 0, 0, 5, 5, 0, 0, 0, 0, 0, 10, 10, 10, 10, 0, 0, 0, 0, 10, 20, 20, 10, 5, 0, 5, 10, 15,
  20, 20, 15, 10, 5, 5, 10, 10, 20, 20, 10, 10, 5, 0, 0, 5, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
];

var BishopTable = [
  0, 0, -10, 0, 0, -10, 0, 0, 0, 0, 0, 10, 10, 0, 0, 0, 0, 0, 10, 15, 15, 10, 0, 0, 0, 10, 15, 20, 20, 15, 10, 0, 0, 10,
  15, 20, 20, 15, 10, 0, 0, 0, 10, 15, 15, 10, 0, 0, 0, 0, 0, 10, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
];

var RookTable = [
  0, 0, 5, 10, 10, 5, 0, 0, 0, 0, 5, 10, 10, 5, 0, 0, 0, 0, 5, 10, 10, 5, 0, 0, 0, 0, 5, 10, 10, 5, 0, 0, 0, 0, 5, 10, 10,
  5, 0, 0, 0, 0, 5, 10, 10, 5, 0, 0, 25, 25, 25, 25, 25, 25, 25, 25, 0, 0, 5, 10, 10, 5, 0, 0
];

var QueenTable = [
  -20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0, -10, -5, 0, 5, 5, 5, 5, 0, -5,
  0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0, 0, 0, -10, -20, -10, -10, -5, -5, -10, -10, -20
];

var KingE = [
  -50, -10, 0, 0, 0, 0, -10, -50, -10, 0, 10, 10, 10, 10, 0, -10, 0, 10, 20, 20, 20, 20, 10, 0, 0, 10, 20, 40, 40, 20, 10,
  0, 0, 10, 20, 40, 40, 20, 10, 0, 0, 10, 20, 20, 20, 20, 10, 0, -10, 0, 10, 10, 10, 10, 0, -10, -50, -10, 0, 0, 0, 0, -10,
  -50
];

var KingO = [
  0, 5, 5, -10, -10, 0, 10, 5, -30, -30, -30, -30, -30, -30, -30, -30, -50, -50, -50, -50, -50, -50, -50, -50, -70, -70,
  -70, -70, -70, -70, -70, -70, -70, -70, -70, -70, -70, -70, -70, -70, -70, -70, -70, -70, -70, -70, -70, -70, -70, -70,
  -70, -70, -70, -70, -70, -70, -70, -70, -70, -70, -70, -70, -70, -70
];

function MaterialDraw() {
  if (0 == brd_pceNum[PIECES.wR] && 0 == brd_pceNum[PIECES.bR] && 0 == brd_pceNum[PIECES.wQ] && 0 == brd_pceNum[PIECES.bQ]) {
    if (0 == brd_pceNum[PIECES.bB] && 0 == brd_pceNum[PIECES.wB]) {
      if (brd_pceNum[PIECES.wN] < 3 && brd_pceNum[PIECES.bN] < 3) return BOOL.TRUE;
    } else if (0 == brd_pceNum[PIECES.wN] && 0 == brd_pceNum[PIECES.bN]) {
      if (Math.abs(brd_pceNum[PIECES.wB] - brd_pceNum[PIECES.bB]) < 2) return BOOL.TRUE;
    } else if (
      (brd_pceNum[PIECES.wN] < 3 && 0 == brd_pceNum[PIECES.wB]) ||
      (brd_pceNum[PIECES.wB] == 1 && 0 == brd_pceNum[PIECES.wN])
    ) {
      if (
        (brd_pceNum[PIECES.bN] < 3 && 0 == brd_pceNum[PIECES.bB]) ||
        (brd_pceNum[PIECES.bB] == 1 && 0 == brd_pceNum[PIECES.bN])
      ) {
        return BOOL.TRUE;
      }
    }
  } else if (0 == brd_pceNum[PIECES.wQ] && 0 == brd_pceNum[PIECES.bQ]) {
    if (brd_pceNum[PIECES.wR] == 1 && brd_pceNum[PIECES.bR] == 1) {
      if (brd_pceNum[PIECES.wN] + brd_pceNum[PIECES.wB] < 2 && brd_pceNum[PIECES.bN] + brd_pceNum[PIECES.bB] < 2) {
        return BOOL.TRUE;
      }
    } else if (brd_pceNum[PIECES.wR] == 1 && 0 == brd_pceNum[PIECES.bR]) {
      if (
        brd_pceNum[PIECES.wN] + brd_pceNum[PIECES.wB] == 0 &&
        (brd_pceNum[PIECES.bN] + brd_pceNum[PIECES.bB] == 1 || brd_pceNum[PIECES.bN] + brd_pceNum[PIECES.bB] == 2)
      ) {
        return BOOL.TRUE;
      }
    } else if (brd_pceNum[PIECES.bR] == 1 && 0 == brd_pceNum[PIECES.wR]) {
      if (
        brd_pceNum[PIECES.bN] + brd_pceNum[PIECES.bB] == 0 &&
        (brd_pceNum[PIECES.wN] + brd_pceNum[PIECES.wB] == 1 || brd_pceNum[PIECES.wN] + brd_pceNum[PIECES.wB] == 2)
      ) {
        return BOOL.TRUE;
      }
    }
  }
  return BOOL.FALSE;
}

var ENDGAME_MAT = 1 * PieceVal[PIECES.wR] + 2 * PieceVal[PIECES.wN] + 2 * PieceVal[PIECES.wP] + PieceVal[PIECES.wK];

function PawnsInit() {
  var index;
  for (index = 0; index < 10; ++index) {
    PawnRanksWhite[index] = RANKS.RANK_8;
    PawnRanksBlack[index] = RANKS.RANK_1;
    PawnCountWhite[index] = 0;
    PawnCountBlack[index] = 0;
  }
  var pceNum;
  var sq;
  for (pceNum = 0; pceNum < brd_pceNum[PIECES.wP]; ++pceNum) {
    sq = brd_pList[PCEINDEX(PIECES.wP, pceNum)];
    if (RanksBrd[sq] < PawnRanksWhite[FilesBrd[sq] + 1]) PawnRanksWhite[FilesBrd[sq] + 1] = RanksBrd[sq];
    PawnCountWhite[FilesBrd[sq] + 1]++;
  }
  for (pceNum = 0; pceNum < brd_pceNum[PIECES.bP]; ++pceNum) {
    sq = brd_pList[PCEINDEX(PIECES.bP, pceNum)];
    if (RanksBrd[sq] > PawnRanksBlack[FilesBrd[sq] + 1]) PawnRanksBlack[FilesBrd[sq] + 1] = RanksBrd[sq];
    PawnCountBlack[FilesBrd[sq] + 1]++;
  }
}

function KingShield(ksq, side) {
  var bonus = 0;
  var rank = RanksBrd[ksq];
  var pawn = side == COLOURS.WHITE ? PIECES.wP : PIECES.bP;
  var home = side == COLOURS.WHITE ? RANKS.RANK_1 : RANKS.RANK_8;
  if (rank != home) return 0;
  var dir = side == COLOURS.WHITE ? 10 : -10;
  var df;
  for (df = -1; df <= 1; df++) {
    var tsq = ksq + dir + df;
    if (SQOFFBOARD(tsq) == BOOL.TRUE) continue;
    if (brd_pieces[tsq] == pawn) bonus += 10;
    else if (SQOFFBOARD(tsq + dir) == BOOL.FALSE && brd_pieces[tsq + dir] == pawn) bonus += 5;
    else bonus -= 8;
  }
  return bonus;
}

function EvalPosition() {
  var pce;
  var pceNum;
  var sq;
  var score = brd_material[COLOURS.WHITE] - brd_material[COLOURS.BLACK];
  var file;
  var rank;
  if (0 == brd_pceNum[PIECES.wP] && 0 == brd_pceNum[PIECES.bP] && MaterialDraw() == BOOL.TRUE) return 0;
  PawnsInit();
  for (file = 1; file <= 8; file++) {
    if (PawnCountWhite[file] > 1) score += PawnDoubled * (PawnCountWhite[file] - 1);
    if (PawnCountBlack[file] > 1) score -= PawnDoubled * (PawnCountBlack[file] - 1);
  }

  pce = PIECES.wP;
  for (pceNum = 0; pceNum < brd_pceNum[pce]; ++pceNum) {
    sq = brd_pList[PCEINDEX(pce, pceNum)];
    score += PawnTable[SQ64(sq)];
    file = FilesBrd[sq] + 1;
    rank = RanksBrd[sq];
    if (PawnRanksWhite[file - 1] == RANKS.RANK_8 && PawnRanksWhite[file + 1] == RANKS.RANK_8) score += PawnIsolated;
    if (PawnRanksBlack[file - 1] <= rank && PawnRanksBlack[file] <= rank && PawnRanksBlack[file + 1] <= rank) {
      score += PawnPassed[rank];
    }
  }

  pce = PIECES.bP;
  for (pceNum = 0; pceNum < brd_pceNum[pce]; ++pceNum) {
    sq = brd_pList[PCEINDEX(pce, pceNum)];
    score -= PawnTable[MIRROR64(SQ64(sq))];
    file = FilesBrd[sq] + 1;
    rank = RanksBrd[sq];
    if (PawnRanksBlack[file - 1] == RANKS.RANK_1 && PawnRanksBlack[file + 1] == RANKS.RANK_1) score -= PawnIsolated;
    if (PawnRanksWhite[file - 1] >= rank && PawnRanksWhite[file] >= rank && PawnRanksWhite[file + 1] >= rank) {
      score -= PawnPassed[7 - rank];
    }
  }

  pce = PIECES.wN;
  for (pceNum = 0; pceNum < brd_pceNum[pce]; ++pceNum) {
    sq = brd_pList[PCEINDEX(pce, pceNum)];
    score += KnightTable[SQ64(sq)];
  }
  pce = PIECES.bN;
  for (pceNum = 0; pceNum < brd_pceNum[pce]; ++pceNum) {
    sq = brd_pList[PCEINDEX(pce, pceNum)];
    score -= KnightTable[MIRROR64(SQ64(sq))];
  }
  pce = PIECES.wB;
  for (pceNum = 0; pceNum < brd_pceNum[pce]; ++pceNum) {
    sq = brd_pList[PCEINDEX(pce, pceNum)];
    score += BishopTable[SQ64(sq)];
  }
  pce = PIECES.bB;
  for (pceNum = 0; pceNum < brd_pceNum[pce]; ++pceNum) {
    sq = brd_pList[PCEINDEX(pce, pceNum)];
    score -= BishopTable[MIRROR64(SQ64(sq))];
  }

  pce = PIECES.wR;
  for (pceNum = 0; pceNum < brd_pceNum[pce]; ++pceNum) {
    sq = brd_pList[PCEINDEX(pce, pceNum)];
    score += RookTable[SQ64(sq)];
    file = FilesBrd[sq] + 1;
    if (PawnRanksWhite[file] == RANKS.RANK_8) {
      if (PawnRanksBlack[file] == RANKS.RANK_1) score += RookOpenFile;
      else score += RookSemiOpenFile;
    }
    if (RanksBrd[sq] == RANKS.RANK_7) score += RookOnSeventh;
  }
  pce = PIECES.bR;
  for (pceNum = 0; pceNum < brd_pceNum[pce]; ++pceNum) {
    sq = brd_pList[PCEINDEX(pce, pceNum)];
    score -= RookTable[MIRROR64(SQ64(sq))];
    file = FilesBrd[sq] + 1;
    if (PawnRanksBlack[file] == RANKS.RANK_1) {
      if (PawnRanksWhite[file] == RANKS.RANK_8) score -= RookOpenFile;
      else score -= RookSemiOpenFile;
    }
    if (RanksBrd[sq] == RANKS.RANK_2) score -= RookOnSeventh;
  }

  pce = PIECES.wQ;
  for (pceNum = 0; pceNum < brd_pceNum[pce]; ++pceNum) {
    sq = brd_pList[PCEINDEX(pce, pceNum)];
    score += QueenTable[SQ64(sq)];
    file = FilesBrd[sq] + 1;
    if (PawnRanksWhite[file] == RANKS.RANK_8) {
      if (PawnRanksBlack[file] == RANKS.RANK_1) score += QueenOpenFile;
      else score += QueenSemiOpenFile;
    }
  }
  pce = PIECES.bQ;
  for (pceNum = 0; pceNum < brd_pceNum[pce]; ++pceNum) {
    sq = brd_pList[PCEINDEX(pce, pceNum)];
    score -= QueenTable[MIRROR64(SQ64(sq))];
    file = FilesBrd[sq] + 1;
    if (PawnRanksBlack[file] == RANKS.RANK_1) {
      if (PawnRanksWhite[file] == RANKS.RANK_8) score -= QueenOpenFile;
      else score -= QueenSemiOpenFile;
    }
  }

  sq = brd_pList[PCEINDEX(PIECES.wK, 0)];
  if (brd_material[COLOURS.BLACK] <= ENDGAME_MAT) score += KingE[SQ64(sq)];
  else {
    score += KingO[SQ64(sq)];
    score += KingShield(sq, COLOURS.WHITE);
  }
  sq = brd_pList[PCEINDEX(PIECES.bK, 0)];
  if (brd_material[COLOURS.WHITE] <= ENDGAME_MAT) score -= KingE[MIRROR64(SQ64(sq))];
  else {
    score -= KingO[MIRROR64(SQ64(sq))];
    score -= KingShield(sq, COLOURS.BLACK);
  }

  if (brd_pceNum[PIECES.wB] >= 2) score += BishopPair;
  if (brd_pceNum[PIECES.bB] >= 2) score -= BishopPair;

  score += 8;
  if (brd_side == COLOURS.WHITE) return score;
  return -score;
}

function ThreeFoldRep() {
  var i = 0;
  var r = 0;
  for (i = 0; i < brd_hisPly; ++i) {
    if (brd_history[i].posKey == brd_posKey) r++;
  }
  return r;
}

function DrawMaterial() {
  if (brd_pceNum[PIECES.wP] != 0 || brd_pceNum[PIECES.bP] != 0) return BOOL.FALSE;
  if (brd_pceNum[PIECES.wQ] != 0 || brd_pceNum[PIECES.bQ] != 0 || brd_pceNum[PIECES.wR] != 0 || brd_pceNum[PIECES.bR] != 0) {
    return BOOL.FALSE;
  }
  if (brd_pceNum[PIECES.wB] > 1 || brd_pceNum[PIECES.bB] > 1) return BOOL.FALSE;
  if (brd_pceNum[PIECES.wN] > 1 || brd_pceNum[PIECES.bN] > 1) return BOOL.FALSE;
  if (brd_pceNum[PIECES.wN] != 0 && brd_pceNum[PIECES.wB] != 0) return BOOL.FALSE;
  if (brd_pceNum[PIECES.bN] != 0 && brd_pceNum[PIECES.bB] != 0) return BOOL.FALSE;
  return BOOL.TRUE;
}

function HasNonPawnMaterial() {
  if (brd_side == COLOURS.WHITE) {
    return brd_pceNum[PIECES.wN] + brd_pceNum[PIECES.wB] + brd_pceNum[PIECES.wR] + brd_pceNum[PIECES.wQ] > 0;
  }
  return brd_pceNum[PIECES.bN] + brd_pceNum[PIECES.bB] + brd_pceNum[PIECES.bR] + brd_pceNum[PIECES.bQ] > 0;
}

function InitTT() {
  var i;
  for (i = 0; i < TTSIZE; i++) {
    ttMove[i] = NOMOVE;
    ttPosKey[i] = 0;
    ttScore[i] = 0;
    ttDepth[i] = 0;
    ttFlags[i] = HFNONE;
  }
}

function TtIndex() {
  return (brd_posKey >>> 0) & TTMASK;
}

function ToTtScore(score) {
  if (score > ISMATE) return score + brd_ply;
  if (score < -ISMATE) return score - brd_ply;
  return score;
}

function FromTtScore(score) {
  if (score > ISMATE) return score - brd_ply;
  if (score < -ISMATE) return score + brd_ply;
  return score;
}

function StoreHash(move, score, flags, depth) {
  var index = TtIndex();
  ttMove[index] = move;
  ttPosKey[index] = brd_posKey;
  ttScore[index] = ToTtScore(score);
  ttDepth[index] = depth;
  ttFlags[index] = flags;
}

function ProbeHashMove() {
  var index = TtIndex();
  if (ttPosKey[index] == brd_posKey) return ttMove[index];
  return NOMOVE;
}

function GetPvLine(depth) {
  var move = ProbeHashMove();
  var count = 0;
  while (move != NOMOVE && count < depth) {
    if (MoveExists(move) == BOOL.TRUE) {
      MakeMove(move);
      brd_PvArray[count++] = move;
    } else {
      break;
    }
    move = ProbeHashMove();
  }
  while (brd_ply > 0) TakeMove();
  return count;
}

function CheckUp() {
  if (Now() - srch_start > srch_time) srch_stop = BOOL.TRUE;
}

function PickNextMove(moveNum) {
  var index = 0;
  var bestScore = -1;
  var bestNum = moveNum;
  var temp;
  for (index = moveNum; index < brd_moveListStart[brd_ply + 1]; ++index) {
    if (brd_moveScores[index] > bestScore) {
      bestScore = brd_moveScores[index];
      bestNum = index;
    }
  }
  temp = brd_moveList[moveNum];
  brd_moveList[moveNum] = brd_moveList[bestNum];
  brd_moveList[bestNum] = temp;
  temp = brd_moveScores[moveNum];
  brd_moveScores[moveNum] = brd_moveScores[bestNum];
  brd_moveScores[bestNum] = temp;
}

function IsRepetition() {
  var index = 0;
  for (index = brd_hisPly - brd_fiftyMove; index < brd_hisPly - 1; ++index) {
    if (index >= 0 && brd_posKey == brd_history[index].posKey) return BOOL.TRUE;
  }
  return BOOL.FALSE;
}

function ClearForSearch() {
  var index;
  for (index = 0; index < 14 * BRD_SQ_NUM; ++index) brd_searchHistory[index] = 0;
  for (index = 0; index < 2 * MAXDEPTH; ++index) brd_searchKillers[index] = 0;
  brd_ply = 0;
  srch_nodes = 0;
  srch_fh = 0;
  srch_fhf = 0;
  srch_start = Now();
  srch_stop = BOOL.FALSE;
  srch_score = 0;
  srch_best = NOMOVE;
  srch_fromBook = BOOL.FALSE;
  srch_depthFound = 0;
  srch_iterDepth = 1;
}

function Quiescence(alpha, beta) {
  if ((srch_nodes & SEARCH_CHECK_MASK) == 0) {
    CheckUp();
    if (srch_stop == BOOL.TRUE) return 0;
  }
  srch_nodes++;
  if (IsRepetition() || brd_fiftyMove >= 100) return 0;
  if (brd_ply > MAXDEPTH - 1) return EvalPosition();
  var Score = EvalPosition();
  if (Score >= beta) return beta;
  if (Score > alpha) alpha = Score;
  var standPat = Score;
  GenerateCaptures();
  var MoveNum = 0;
  var Legal = 0;
  var OldAlpha = alpha;
  var BestMove = NOMOVE;
  var hashMove = ProbeHashMove();
  if (hashMove != NOMOVE) {
    for (MoveNum = brd_moveListStart[brd_ply]; MoveNum < brd_moveListStart[brd_ply + 1]; ++MoveNum) {
      if (brd_moveList[MoveNum] == hashMove) {
        brd_moveScores[MoveNum] = 2000000;
        break;
      }
    }
  }
  for (MoveNum = brd_moveListStart[brd_ply]; MoveNum < brd_moveListStart[brd_ply + 1]; ++MoveNum) {
    PickNextMove(MoveNum);
    var move = brd_moveList[MoveNum];
    var cap = CAPTURED(move);
    if (cap != PIECES.EMPTY && standPat + PieceVal[cap] + 200 < alpha) continue;
    if (MakeMove(move) == BOOL.FALSE) continue;
    Legal++;
    Score = -Quiescence(-beta, -alpha);
    TakeMove();
    if (srch_stop == BOOL.TRUE) return 0;
    if (Score > alpha) {
      if (Score >= beta) {
        if (Legal == 1) srch_fhf++;
        srch_fh++;
        return beta;
      }
      alpha = Score;
      BestMove = move;
    }
  }
  if (alpha != OldAlpha) StoreHash(BestMove, alpha, HFEXACT, 0);
  return alpha;
}

function AlphaBeta(alpha, beta, depth, doNull) {
  if (depth <= 0) return Quiescence(alpha, beta);
  if ((srch_nodes & SEARCH_CHECK_MASK) == 0) {
    CheckUp();
    if (srch_stop == BOOL.TRUE) return 0;
  }
  srch_nodes++;
  if ((IsRepetition() || brd_fiftyMove >= 100) && brd_ply != 0) return 0;
  if (brd_ply > MAXDEPTH - 1) return EvalPosition();
  if (alpha < -MATE + brd_ply) alpha = -MATE + brd_ply;
  if (beta > MATE - brd_ply - 1) beta = MATE - brd_ply - 1;
  if (alpha >= beta) return alpha;

  var InCheck = SqAttacked(brd_pList[PCEINDEX(Kings[brd_side], 0)], brd_side ^ 1);
  if (InCheck == BOOL.TRUE) depth++;

  var Score = -INFINITE;
  var ttIndex = TtIndex();
  var hashMove = NOMOVE;
  if (ttPosKey[ttIndex] == brd_posKey) {
    hashMove = ttMove[ttIndex];
    if (ttDepth[ttIndex] >= depth && brd_ply != 0) {
      Score = FromTtScore(ttScore[ttIndex]);
      var f = ttFlags[ttIndex];
      if (f == HFEXACT) return Score;
      if (f == HFALPHA && Score <= alpha) return Score;
      if (f == HFBETA && Score >= beta) return Score;
    }
  }

  var staticEval = 0;
  if (InCheck == BOOL.FALSE) staticEval = EvalPosition();

  if (InCheck == BOOL.FALSE && depth <= 3 && brd_ply != 0) {
    if (staticEval - 150 * depth >= beta) return staticEval;
  }
  if (InCheck == BOOL.FALSE && depth <= 2 && brd_ply != 0 && hashMove == NOMOVE) {
    if (staticEval + 250 * depth < alpha) return Quiescence(alpha, beta);
  }

  if (
    doNull == BOOL.TRUE &&
    InCheck == BOOL.FALSE &&
    brd_ply != 0 &&
    depth >= 3 &&
    HasNonPawnMaterial() &&
    staticEval >= beta
  ) {
    var R = 2;
    if (depth > 6) R = 3;
    MakeNullMove();
    Score = -AlphaBeta(-beta, -beta + 1, depth - 1 - R, BOOL.FALSE);
    TakeNullMove();
    if (srch_stop == BOOL.TRUE) return 0;
    if (Score >= beta) {
      if (Score >= ISMATE) Score = beta;
      return Score;
    }
  }

  GenerateMoves();
  var MoveNum = 0;
  var Legal = 0;
  var OldAlpha = alpha;
  var BestMove = NOMOVE;
  var BestScore = -INFINITE;
  if (hashMove != NOMOVE) {
    for (MoveNum = brd_moveListStart[brd_ply]; MoveNum < brd_moveListStart[brd_ply + 1]; ++MoveNum) {
      if (brd_moveList[MoveNum] == hashMove) {
        brd_moveScores[MoveNum] = 2000000;
        break;
      }
    }
  }

  for (MoveNum = brd_moveListStart[brd_ply]; MoveNum < brd_moveListStart[brd_ply + 1]; ++MoveNum) {
    PickNextMove(MoveNum);
    var move = brd_moveList[MoveNum];
    if (MakeMove(move) == BOOL.FALSE) continue;
    Legal++;
    var isCap = (move & MFLAGCAP) != 0;
    var isProm = (move & MFLAGPROM) != 0;
    var givesCheck = SqAttacked(brd_pList[PCEINDEX(Kings[brd_side], 0)], brd_side ^ 1);
    var newDepth = depth - 1;
    if (InCheck == BOOL.FALSE && isCap == false && isProm == false && givesCheck == BOOL.FALSE && Legal > 3 && depth >= 3) {
      var reduce = 1;
      if (Legal > 6 && depth >= 5) reduce = 2;
      Score = -AlphaBeta(-alpha - 1, -alpha, newDepth - reduce, BOOL.TRUE);
      if (Score > alpha) Score = -AlphaBeta(-beta, -alpha, newDepth, BOOL.TRUE);
    } else if (Legal == 1) {
      Score = -AlphaBeta(-beta, -alpha, newDepth, BOOL.TRUE);
    } else {
      Score = -AlphaBeta(-alpha - 1, -alpha, newDepth, BOOL.TRUE);
      if (Score > alpha && Score < beta) Score = -AlphaBeta(-beta, -alpha, newDepth, BOOL.TRUE);
    }
    TakeMove();
    if (srch_stop == BOOL.TRUE) return 0;
    if (Score > BestScore) {
      BestScore = Score;
      BestMove = move;
      if (Score > alpha) {
        if (Score >= beta) {
          if (Legal == 1) srch_fhf++;
          srch_fh++;
          if (isCap == false) {
            brd_searchKillers[MAXDEPTH + brd_ply] = brd_searchKillers[brd_ply];
            brd_searchKillers[brd_ply] = move;
          }
          StoreHash(move, Score, HFBETA, depth);
          return Score;
        }
        alpha = Score;
        if (isCap == false) {
          brd_searchHistory[brd_pieces[FROMSQ(move)] * BRD_SQ_NUM + TOSQ(move)] += depth * depth;
        }
      }
    }
  }

  if (Legal == 0) {
    if (InCheck) return -MATE + brd_ply;
    return 0;
  }
  if (alpha != OldAlpha) StoreHash(BestMove, BestScore, HFEXACT, depth);
  else StoreHash(BestMove, BestScore, HFALPHA, depth);
  return BestScore;
}

function SearchBegin() {
  ClearForSearch();
  srch_thinking = BOOL.TRUE;
  if (GameController.BookLoaded == BOOL.TRUE) {
    var bookMove = BookMove();
    if (bookMove != NOMOVE) {
      srch_best = bookMove;
      srch_fromBook = BOOL.TRUE;
      srch_thinking = BOOL.FALSE;
      srch_depthFound = 0;
      srch_score = 0;
      return BOOL.TRUE;
    }
  }
  return BOOL.FALSE;
}

function SearchIterate() {
  var currentDepth = srch_iterDepth;
  var score;
  if (currentDepth <= 2) {
    score = AlphaBeta(-INFINITE, INFINITE, currentDepth, BOOL.TRUE);
  } else {
    var window = 50;
    score = AlphaBeta(srch_score - window, srch_score + window, currentDepth, BOOL.TRUE);
    if (srch_stop == BOOL.FALSE && (score <= srch_score - window || score >= srch_score + window)) {
      score = AlphaBeta(-INFINITE, INFINITE, currentDepth, BOOL.TRUE);
    }
  }
  if (srch_stop == BOOL.TRUE) {
    srch_thinking = BOOL.FALSE;
    return BOOL.TRUE;
  }
  srch_score = score;
  GetPvLine(currentDepth);
  if (brd_PvArray[0] != NOMOVE) srch_best = brd_PvArray[0];
  srch_depthFound = currentDepth;
  if (score > MATE - 64 || score < -MATE + 64) {
    srch_thinking = BOOL.FALSE;
    return BOOL.TRUE;
  }
  if (Now() - srch_start > srch_time * 0.65 && currentDepth >= 2) {
    srch_thinking = BOOL.FALSE;
    return BOOL.TRUE;
  }
  srch_iterDepth++;
  if (srch_iterDepth > srch_depth) {
    srch_thinking = BOOL.FALSE;
    return BOOL.TRUE;
  }
  return BOOL.FALSE;
}

function SearchPosition() {
  if (SearchBegin() == BOOL.TRUE) return srch_best;
  while (SearchIterate() == BOOL.FALSE) {}
  return srch_best;
}

function PerftCount(depth) {
  if (depth == 0) return 1;
  GenerateMoves();
  var nodes = 0;
  var index;
  for (index = brd_moveListStart[brd_ply]; index < brd_moveListStart[brd_ply + 1]; ++index) {
    if (MakeMove(brd_moveList[index]) == BOOL.FALSE) continue;
    nodes += PerftCount(depth - 1);
    TakeMove();
  }
  return nodes;
}

function LegalMoveCount() {
  GenerateMoves();
  var found = 0;
  var MoveNum;
  for (MoveNum = brd_moveListStart[brd_ply]; MoveNum < brd_moveListStart[brd_ply + 1]; ++MoveNum) {
    if (MakeMove(brd_moveList[MoveNum]) == BOOL.FALSE) continue;
    found++;
    TakeMove();
  }
  return found;
}

function InCheckNow() {
  return SqAttacked(brd_pList[PCEINDEX(Kings[brd_side], 0)], brd_side ^ 1);
}

function InitBoardVars() {
  var index;
  brd_history = [];
  for (index = 0; index < MAXGAMEMOVES; index++) {
    brd_history.push({
      move: NOMOVE,
      castlePerm: 0,
      enPas: 0,
      fiftyMove: 0,
      fullMove: 1,
      posKey: 0
    });
  }
}

function InitHashKeys() {
  var index;
  randSeed = 0x9d2c5680;
  for (index = 0; index < 13 * 120; ++index) PieceKeys[index] = RAND_32();
  SideKey = RAND_32();
  for (index = 0; index < 16; ++index) CastleKeys[index] = RAND_32();
}

function InitSq120To64() {
  var index;
  var file;
  var rank;
  var sq;
  var sq64 = 0;
  for (index = 0; index < BRD_SQ_NUM; ++index) Sq120ToSq64[index] = 65;
  for (index = 0; index < 64; ++index) Sq64ToSq120[index] = 120;
  for (rank = RANKS.RANK_1; rank <= RANKS.RANK_8; ++rank) {
    for (file = FILES.FILE_A; file <= FILES.FILE_H; ++file) {
      sq = FR2SQ(file, rank);
      Sq64ToSq120[sq64] = sq;
      Sq120ToSq64[sq] = sq64;
      sq64++;
    }
  }
}

function InitFilesRanksBrd() {
  var index;
  var file;
  var rank;
  var sq;
  for (index = 0; index < BRD_SQ_NUM; ++index) {
    FilesBrd[index] = SQUARES.OFFBOARD;
    RanksBrd[index] = SQUARES.OFFBOARD;
  }
  for (rank = RANKS.RANK_1; rank <= RANKS.RANK_8; ++rank) {
    for (file = FILES.FILE_A; file <= FILES.FILE_H; ++file) {
      sq = FR2SQ(file, rank);
      FilesBrd[sq] = file;
      RanksBrd[sq] = rank;
    }
  }
}

var BOOK_LINES = [
  "e2e4 e7e5 g1f3 b8c6 f1b5 a7a6 b5a4 g8f6 e1g1 f8e7 f1e1 b7b5 a4b3 d7d6 c2c3 e8g8",
  "e2e4 e7e5 g1f3 b8c6 f1b5 a7a6 b5a4 g8f6 e1g1 f8e7",
  "e2e4 e7e5 g1f3 b8c6 f1b5 a7a6 b5c6 d7c6",
  "e2e4 e7e5 g1f3 b8c6 f1c4 g8f6 d2d3 f8c5",
  "e2e4 e7e5 g1f3 b8c6 f1c4 f8c5 c2c3 g8f6 d2d4 e5d4 c3d4 c5b4",
  "e2e4 e7e5 g1f3 b8c6 d2d4 e5d4 f3d4 g8f6 d4c6 b7c6 e4e5",
  "e2e4 e7e5 g1f3 d7d6 d2d4 e5d4 f3d4 g8f6 b1c3 f8e7",
  "e2e4 e7e5 b1c3 g8f6 f1c4 b8c6 d2d3",
  "e2e4 e7e5 f2f4 e5f4 g1f3 g7g5 h2h4 g5g4 f3e5",
  "e2e4 c7c5 g1f3 d7d6 d2d4 c5d4 f3d4 g8f6 b1c3 a7a6",
  "e2e4 c7c5 g1f3 d7d6 d2d4 c5d4 f3d4 g8f6 b1c3 g7g6",
  "e2e4 c7c5 g1f3 d7d6 d2d4 c5d4 f3d4 g8f6 b1c3 b8c6",
  "e2e4 c7c5 g1f3 b8c6 d2d4 c5d4 f3d4 g8f6 b1c3 e7e6",
  "e2e4 c7c5 g1f3 e7e6 d2d4 c5d4 f3d4 a7a6",
  "e2e4 c7c5 c2c3 g8f6 e4e5 f6d5 d2d4 c5d4",
  "e2e4 c7c5 b1c3 b8c6 g2g3 g7g6 f1g2 f8g7",
  "e2e4 e7e6 d2d4 d7d5 b1c3 f8b4 e4e5 c7c5 a2a3 b4c3 b2c3",
  "e2e4 e7e6 d2d4 d7d5 b1c3 g8f6 f1g5",
  "e2e4 e7e6 d2d4 d7d5 b1d2 g8f6 e4e5 f6d7",
  "e2e4 e7e6 d2d4 d7d5 e4e5 c7c5 c2c3 b8c6",
  "e2e4 c7c6 d2d4 d7d5 b1c3 d5e4 c3e4 b8d7",
  "e2e4 c7c6 d2d4 d7d5 e4e5 c8f5 g1f3 e7e6",
  "e2e4 c7c6 d2d4 d7d5 e4d5 c6d5 c2c4",
  "e2e4 d7d5 e4d5 d8d5 b1c3 d5a5 d2d4 g8f6",
  "e2e4 g8f6 e4e5 f6d5 d2d4 d7d6 g1f3",
  "e2e4 g7g6 d2d4 f8g7 b1c3 d7d6",
  "d2d4 d7d5 c2c4 e7e6 b1c3 g8f6 c4d5 e6d5 c1g5",
  "d2d4 d7d5 c2c4 e7e6 b1c3 g8f6 g1f3 f8e7",
  "d2d4 d7d5 c2c4 c7c6 g1f3 g8f6 b1c3 d5c4 a2a4",
  "d2d4 d7d5 c2c4 c7c6 g1f3 g8f6 e2e3 e7e6",
  "d2d4 d7d5 c2c4 d5c4 g1f3 g8f6 e2e3 e7e6 f1c4 c7c5",
  "d2d4 d7d5 g1f3 g8f6 c1f4",
  "d2d4 d7d5 g1f3 g8f6 c1g5",
  "d2d4 g8f6 c2c4 e7e6 b1c3 f8b4 e2e3 e8g8",
  "d2d4 g8f6 c2c4 e7e6 g1f3 b7b6 g2g3 c8b7 f1g2",
  "d2d4 g8f6 c2c4 g7g6 b1c3 f8g7 e2e4 d7d6",
  "d2d4 g8f6 c2c4 g7g6 g1f3 f8g7 g2g3 e8g8 f1g2 d7d6",
  "d2d4 g8f6 c2c4 c7c5 d4d5 e7e6 b1c3 e6d5 c4d5 d7d6",
  "d2d4 g8f6 g1f3 e7e6 c1g5 h7h6",
  "d2d4 g8f6 g1f3 g7g6 c1f4 f8g7",
  "d2d4 f7f5 c2c4 g8f6 g1f3 e7e6 g2g3",
  "c2c4 e7e5 b1c3 g8f6 g1f3 b8c6",
  "c2c4 c7c5 b1c3 b8c6 g2g3 g7g6 f1g2 f8g7",
  "c2c4 g8f6 b1c3 e7e5",
  "g1f3 d7d5 g2g3 g8f6 f1g2",
  "g1f3 g8f6 c2c4 e7e6 g2g3 d7d5 f1g2",
  "e2e4 e7e5 g1f3 b8c6 f1b5",
  "e2e4 e7e5 g1f3 b8c6",
  "e2e4 e7e5 g1f3",
  "e2e4 e7e5",
  "e2e4 c7c5 g1f3",
  "e2e4 c7c5",
  "e2e4 e7e6",
  "e2e4 c7c6",
  "e2e4",
  "d2d4 d7d5 c2c4",
  "d2d4 d7d5",
  "d2d4 g8f6 c2c4",
  "d2d4 g8f6",
  "d2d4",
  "c2c4",
  "g1f3"
];

function InitBook() {
  brd_bookLines = BOOK_LINES;
  GameController.BookLoaded = BOOL.TRUE;
}

function InitEngine() {
  InitFilesRanksBrd();
  InitSq120To64();
  InitHashKeys();
  InitBoardVars();
  InitMvvLva();
  InitTT();
  InitBook();
  srch_thinking = BOOL.FALSE;
}
