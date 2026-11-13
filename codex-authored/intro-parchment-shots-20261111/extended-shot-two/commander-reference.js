'use strict';

// This contour follows the edge of the supplied 838 × 585 screenshot.
// The original RGB artwork is drawn into the matte without repainting.
function makeReferenceCommander(image, chin, chinEdge, layer) {
  if (image.width !== 838 || image.height !== 585) {
    throw Error('Unexpected archangel reference size');
  }

  const outline = new Path2D(
    'M4 21 Q9 14 29 32 C60 56 79 83 99 119 Q116 141 132 151 ' +
    'Q155 161 171 174 Q185 184 198 195 L236 207 Q220 190 211 175 Q201 161 188 156 ' +
    'Q212 145 246 157 Q227 137 217 125 Q203 132 190 118 Q181 108 179 94 ' +
    'Q166 90 161 75 C154 57 157 40 151 19 Q151 6 159 10 ' +
    'C181 22 197 44 215 61 Q232 80 249 92 C273 105 310 103 327 125 ' +
    'Q358 139 371 168 Q392 186 411 208 Q410 199 412 195 Q422 199 433 217 ' +
    'Q446 236 452 254 Q459 256 469 280 Q470 270 474 279 ' +
    'Q485 300 492 323 Q495 329 498 337 Q511 344 526 334 ' +
    'Q545 322 563 315 L562 309 Q557 305 561 290 Q554 279 561 264 L571 251 ' +
    'Q565 253 558 258 Q559 248 570 235 Q585 221 607 208 L627 193 ' +
    'Q627 185 635 179 L635 153 L628 143 Q617 144 614 138 Q613 133 622 130 ' +
    'L630 127 L643 131 L647 123 L639 115 Q627 115 627 107 Q626 102 634 104 ' +
    'L645 106 Q650 109 656 115 L660 126 L663 128 Q664 117 664 109 ' +
    'L659 100 Q653 92 656 87 Q659 82 665 89 L676 101 Q679 92 683 96 ' +
    'Q686 99 685 111 L689 120 L687 134 Q689 143 687 151 Q682 160 677 174 ' +
    'L670 185 Q673 192 668 199 L664 208 L657 211 C644 235 641 249 634 258 ' +
    'Q630 269 624 270 L624 282 Q649 281 665 305 Q669 311 674 321 ' +
    'C696 302 713 286 731 282 Q740 280 753 288 C786 294 804 313 807 343 ' +
    'C813 367 810 388 794 401 Q790 405 785 402 Q777 411 763 415 L743 418 ' +
    'Q743 431 737 443 L729 440 Q729 452 730 472 Q729 495 723 498 ' +
    'L719 492 Q714 487 705 494 Q694 507 684 532 Q680 533 681 523 ' +
    'Q670 520 655 525 Q636 535 620 552 Q614 555 616 549 ' +
    'Q637 524 640 512 Q636 503 629 507 Q608 516 584 520 L581 515 ' +
    'Q561 520 542 516 Q534 532 514 539 Q495 549 470 545 L449 544 ' +
    'Q437 544 421 551 Q405 557 386 555 Q382 554 379 550 ' +
    'Q362 563 340 565 Q318 563 310 554 Q297 546 289 527 L282 511 ' +
    'Q276 499 282 495 Q285 494 291 500 Q288 489 293 483 Q300 481 305 493 ' +
    'L307 505 Q315 511 324 512 L338 518 Q348 516 347 510 Q352 499 360 495 ' +
    'Q356 487 348 484 Q342 481 333 477 Q325 471 321 463 Q318 455 323 449 ' +
    'Q327 447 334 453 L351 457 Q359 457 371 464 L385 474 L406 488 ' +
    'Q420 486 429 488 Q437 481 451 475 Q457 462 469 452 ' +
    'Q449 456 430 449 Q410 448 398 444 L391 453 Q384 456 379 445 ' +
    'Q353 443 339 431 Q324 427 316 414 Q306 408 293 409 L293 402 ' +
    'Q292 396 282 387 Q272 385 268 375 Q251 360 236 344 Q225 334 222 328 ' +
    'L224 321 Q217 321 209 306 Q196 290 187 275 Q178 282 171 276 ' +
    'Q160 269 156 258 Q147 260 142 249 Q135 243 126 244 L119 235 ' +
    'Q100 224 94 204 Q85 187 77 171 Q71 164 66 154 Q51 155 41 145 ' +
    'Q35 138 32 126 Q20 119 15 103 C8 81 14 66 7 44 Q3 31 4 21 Z'
  );

  const matte = layer(image.width, image.height, { alpha: true });
  matte.drawImage(image, 0, 0);

  // Align the tucked chin with the unmodified gold seam and shoulder.
  const patch = layer(image.width, image.height, { alpha: true });
  patch.imageSmoothingQuality = 'high';
  patch.drawImage(chin, 568, 241, 258, 230);

  // Replace just the short vertical rim nearest the upper shoulder clasp.
  const edgePatch = layer(image.width, image.height, { alpha: true });
  edgePatch.imageSmoothingQuality = 'high';
  edgePatch.drawImage(chinEdge, 568, 241, 258, 230);
  edgePatch.globalCompositeOperation = 'destination-in';
  edgePatch.filter = 'blur(1.35px)';
  edgePatch.fill(new Path2D(
    'M678 330 C671 331 667 337 662 344 ' +
    'C655 350 653 358 657 364 C662 369 672 369 681 367 ' +
    'C690 365 698 362 699 358 C699 351 695 340 689 334 Q683 328 678 330 Z'
  ));
  patch.drawImage(edgePatch.canvas, 0, 0);
  patch.globalCompositeOperation = 'destination-in';
  patch.filter = 'blur(1.7px)';
  patch.fill(new Path2D(
    'M670 328 C664 335 658 339 653 344 ' +
    'C649 348 649 351 645 352 C641 355 637 359 638 363 ' +
    'C642 367 646 371 651 374 C655 378 663 379 675 379 ' +
    'C690 380 706 376 715 373 C723 371 727 368 729 365 ' +
    'C726 359 717 354 707 351 C694 349 689 338 685 331 ' +
    'Q680 324 670 328 Z'
  ));
  matte.drawImage(patch.canvas, 0, 0);
  matte.globalCompositeOperation = 'destination-in';
  matte.fill(outline);


  // Work only along the cut edge. The bright screenshot fringe is wider on
  // the lower silhouette, so trim it locally while keeping the original fill.
  const source = matte.getImageData(0, 0, image.width, image.height);
  const { width, height, data } = source;
  const distance = new Float32Array(width * height);
  for (let i = 0; i < distance.length; i++) distance[i] = data[i * 4 + 3] < 128 ? 0 : 32;
  const diagonal = Math.SQRT2;
  for (let y = 1; y < height; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      distance[i] = Math.min(distance[i], distance[i - 1] + 1, distance[i - width] + 1,
        distance[i - width - 1] + diagonal, distance[i - width + 1] + diagonal);
    }
  }
  for (let y = height - 2; y >= 0; y--) {
    for (let x = width - 2; x >= 1; x--) {
      const i = y * width + x;
      distance[i] = Math.min(distance[i], distance[i + 1] + 1, distance[i + width] + 1,
        distance[i + width - 1] + diagonal, distance[i + width + 1] + diagonal);
    }
  }
  for (let i = 0; i < distance.length; i++) {
    if (distance[i] > 6) continue;
    const j = i * 4;
    const red = data[j], green = data[j + 1], blue = data[j + 2];
    const luminance = red * 0.21 + green * 0.72 + blue * 0.07;
    const chroma = Math.max(red, green, blue) - Math.min(red, green, blue);
    const pale = Math.max(0, Math.min(1, (luminance - 145) / 71)) *
      Math.max(0, Math.min(1, (56 - chroma) / 34));
    const inset = 1.15 + 4.1 * pale;
    const edge = Math.max(0, Math.min(1, (distance[i] - inset + 0.76) / 1.52));
    data[j + 3] = Math.round(data[j + 3] * edge);
  }
  matte.globalCompositeOperation = 'source-over';
  matte.putImageData(source, 0, 0);

  const cel = layer(1536, 1024, { alpha: true });
  cel.imageSmoothingQuality = 'high';
  const scale = 1.66;
  cel.drawImage(matte.canvas, 26, 0, image.width * scale, image.height * scale);
  return cel.canvas;
}
