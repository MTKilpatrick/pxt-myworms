//% color=#008A4B icon="\uf11b"


namespace worms {
    const CORNX: number[] = [16, -1, 0, -1]
    const CORNY: number[] = [-1, 6, -1, 0]
    const DELTA_X: number[] = [1, 0, -1, 0]
    const DELTA_Y: number[] = [0, 1, 0, -1]
    const NEXT_DIR: number[] = [1, 2, 3, 0]

    //    let _theworms: Worm[] 
    let _shrinkOnRestart: boolean = false

    //% blockId=worms_restart_options
    //% block="%worm keep length at restart %shrink"
    export function setRestartOpts(shrink: boolean) {
        _shrinkOnRestart = shrink
    }

    //% blockId=worms_create_worm
    //% block="create worm at x: %x y: %y length %len direction %dir"
    //% inlineInputMode=inline
    export function createWorm(x: number, y: number, len: number, dir: number): Worm {
        init()
        let p = new Worm(x, y, len, dir)
        return p
    }

    //%
    export class Worm {
        private _scorey: number
        private _collided: number
        private _rotate: boolean
        private _score: number
        private _grow: boolean
        private _updated: boolean
        private _length: number
        private _head: number
        private _direction: number
        private _blink: boolean
        private _wormx: number[] = []
        private _wormy: number[] = []
        private _initx: number
        private _inity: number
        private _initl: number
        private _initd: number

        constructor(x: number, y: number, length: number, direction: number) {
            this._initx = x
            this._inity = y
            this._initl = length
            this._initd = direction
            this._scorey = 0
            this._score = 0
            this._blink = false

            this.initialiseWorm(x, y, length, direction)
        }

        initialiseWorm(x: number, y: number, length: number, direction: number) {
            this._collided = -1;
            this._rotate = false
            this._grow = false
            this._updated = true
            this._length = length
            this._head = length - 1
            this._direction = direction
            for (let index = 0, tempx = x, tempy = y; index < length; index++) {
                this._wormx.push(tempx)
                this._wormy.push(tempy)
                myscrollbit.setPixel(tempx, tempy, true)
                tempx += DELTA_X[direction]
                tempy += DELTA_Y[direction]
            }
            init()
            //           _theworms.push(this)
        }

        //% blockId=worms_restart_worm
        //% block="restart %worm"
        public restartWorm(): void {
            let ll = this._length;
            while (this._wormx.length > 0) {
                this._wormx.pop()
                this._wormy.pop()
            }
            if (_shrinkOnRestart) {
                ll = this._initl
            }
            this.initialiseWorm(this._initx, this._inity, ll, this._initd)
            this.plotScore()
        }

        /* Move the worm in the direction stored in this._direction
         * This does not draw the worm and does not delete the last segment -
         * it pushes the new head segment position into the array
         */
        //% blockId=worms_move_worm
        //% block="%worm| move worm"
        //% weight=50
        public move(): void {
            if (this._wormx[this._head] == CORNX[this._direction] || this._wormy[this._head] == CORNY[this._direction]) {
                this._direction = NEXT_DIR[this._direction]
            } else if (this._rotate) {
                this._rotate = false
                this._direction = NEXT_DIR[this._direction]
            }
            this._wormx.push(this._wormx[this._head] + DELTA_X[this._direction])
            this._wormy.push(this._wormy[this._head] + DELTA_Y[this._direction])
            this._updated = false
        }

        /* Draw the worm
         * This clears the pixel from the tail and shifts the array such that the
         * new head pixel is in wormx/y[head]
         * If the grow flag is set the length is incremented and the tail pixel is not deleted
         */
        //% blockId=worms_draw_worm
        //% block="%worm| draw worm"
        //% weight=40
        public draw(): void {
            if (this._blink) {
                myscrollbit.blinkPixel(this._wormx[0], this._wormy[0], false)
                myscrollbit.blinkPixel(this._wormx[1], this._wormy[1], true)
            }
            if (!this._grow) {
                myscrollbit.setPixel(this._wormx[0], this._wormy[0], false)
                myscrollbit.setPixel(this._wormx[this._length], this._wormy[this._length], true)
                this._wormx.shift()
                this._wormy.shift()
            } else {
                this._grow = false
                myscrollbit.setPixel(this._wormx[this._length], this._wormy[this._length], true)
                this._length += 1
                this._head += 1
            }
            this._updated = true
        }

        //% blockId="worms_plot_score"
        //% block="plot score for %worm"
        public plotScore(): void {
            for (let i = 0; i < 5; i++) {
                if (this._score > i) {
                    led.plot(i, this._scorey)
                } else {
                    led.unplot(i, this._scorey)
                }
            }
        }

        /* has the worm hit any of its own pixels?
         * return the number of the pixel (from 1 - length) or return zero
         * note that first segment "1" is actually segment[0] -
         * this allow the function to be treated as a boolean (non-zero = true)
         */
        //% blockId=worm_hit_self
        //% block="has %worm hit itself"
        public isAtSelf(): boolean {
            for (let i = 0; i < this._head; i++) {
                if ((this._wormx[i] == this._wormx[this._head]) && (this._wormy[i] == this._wormy[this._head])) {
                    this._collided = i;
                    return true
                }
            }
            return false
        }

        /* check the x,y position of all segments of the worm
         * and return segment number if match, or return zero
         * note that first segment will return 1 but this is actually segment[0]
         */
        //% blockId=worms_is_any_segment_at
        //% block="is any %worm| segment at x %x y %y"
        public isAnySegmentAt(x: number, y: number): boolean {
            for (let i = 0; i <= this._head; i++) {
                if ((this._wormx[i] == x) && (this._wormy[i] == y)) {
                    return true
                }
            }
            return false
        }

        /* check the x,y position of the head of the worm
         * use this after drawing the worm
         */
        //% blockId=worms_is_worm_head_at
        //% block="is %worm| head at x %x y %y"
        public isHeadAt(x: number, y: number): boolean {
            return ((this._wormx[this._head] == x) && (this._wormy[this._head] == y))
        }

        /* collision check used before Draw() to examine the pixel where the new head will be */
        //% blockId=worms_will_hit_pixel
        //% block="will %worm hit a pixel"
        public willHitPixel(): boolean {
            return (myscrollbit.isPixel(this._wormx[this._length], this._wormy[this._length]))
        }

        /* check the position of the new head after executing Move()
         * but before updating the display with Draw()
         */
        //% blockId=worms_will_be_at
        //% block="will %worm| be at x %x y %y"
        public willBeAt(x: number, y: number): boolean {
            if (!this._updated) {
                return ((this._wormx[this._length] == x) && (this._wormy[this._length] == y))
            } else {
                return false
            }
        }

        //% blockId=worms_get_length
        //% block="%worm| get worm length"
        public length(): number {
            return this._length
        }

        //% blockId=worms_set_score_y
        //% block="%worm| set score Y %y"
        public setScoreY(y: number): void {
            this._scorey = y
        }

        //% blockId=worms_get_x
        //% block="%worm| get worm x"
        public xPos(): number {
            return this._wormx[this._head]
        }

        //% blockId=worms_get_y
        //% block="%worm| get worm y"
        public yPos(): number {
            return this._wormy[this._head]
        }

        //% blockId=worms_get_direction
        //% block="%worm| get worm diection"
        public direction(): number {
            return this._direction
        }

        //% blockId=worms_rotate
        //% block="%worm| rotate worm direction"
        public setRotate(): void {
            this._rotate = true
        }

        //% blockId=worms_blink
        //% block="%worm| set blink %blink"
        public setBlink(blink: boolean): void {
            this._blink = blink
        }

        //% blockId=worms_inc_score
        //% block="%worm| increment score"
        public incScore(): void {
            this._score = Math.clamp(0, 5, this._score + 1)
            this.plotScore()
        }

        //% blockId=worms_dex_score
        //% block="%worm| decrement score"
        public decScore(): void {
            this._score = Math.clamp(0, 5, this._score - 1)
            this.plotScore()
        }

        //% blockId=worms_get_score
        //% block="%worm| get score"
        public getScore(): number {
            return this._score
        }

        //% blockId=worms_grow
        //% block="%worm grow"
        //% weight=15
        public grow(): void {
            this._grow = true
        }

        //% blockId=worms_set_direction
        //% block="%worm|set worm direction to %dir"
        //% weight=16
        public setDirection(dir: number): void {
            this._direction = dir
        }

        //% block_id=worms_undraw
        //% block="%worm undraw all"
        public unDraw(): void {
            for (let i = 0; i < this._length; i++) {
                myscrollbit.setPixel(this._wormx[i], this._wormy[i], false)
            }
        }


    }


    function init(): void {
        //        _theworms = (<Worm[]>[])
        CORNX[0] = myscrollbit.maxX()
        CORNY[1] = myscrollbit.maxY()
    }

}
declare namespace worms {
}