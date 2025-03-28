<!-- ЭТО КОД ДЛЯ СТРАНИЦЫ ВХОДА И РЕГИСТРАЦИИ, НО У МЕНЯ НАКЛАДЫВАЛИСЬ КАКИЕ-ТО СТИЛИ ДРУГ НА ДРУГА И НЕ ПОЛУЧИЛОСЬ ПРИМЕНИТЬ ЭТУ КРАСОТУ,
А ТАМ ДЕЙСТВИТЕЛЬНО КРАСИВО ПОЛУЧАЛОСЬ СО СТИЛЯМИ И АНИМАЦИЕЙ..... -->
                
                <nav class="login">
                    <button class="btnLogin-popup">Login</button>
                </nav>

                <div class="wrapper">
                    <span class="icon-close"><ion-icon name="close"></ion-icon></span>
                    <div class="form-box login">
                        <h2>Login</h2>
                        <form action="#">
                            <div class="input-box">
                                <span class="icon"><ion-icon name="mail"></ion-icon></span>
                                <input type="email" required>
                                <label>Email</label>
                            </div>
                            <div class="input-box">
                                <span class="icon"><ion-icon name="lock-closed"></ion-icon></span>
                                <input type="password" required>
                                <label>Password</label>
                            </div>
                            <div class="remember-forgot">
                                <label><input type="checkbox">Remember me</label>
                                <a href="#">Forgot password?</a>
                            </div>
                            <button type="submit" class="btn">Login</button>
                            <div class="login-register">
                                <p>Don't have an account?<a href="#"
                                class="register-link">Register</a></p>
                            </div>
                        </form>
                    </div>
                    
                    <div class="form-box register">
                        <h2>Registration</h2>
                        <form action="#">
                            <div class="input-box">
                                <span class="icon"><ion-icon name="person"></ion-icon></span>
                                <input type="text" required>
                                <label>Username</label>
                            </div>
                            <div class="input-box">
                                <span class="icon"><ion-icon name="mail"></ion-icon></span>
                                <input type="email" required>
                                <label>Email</label>
                            </div>
                            <div class="input-box">
                                <span class="icon"><ion-icon name="lock-closed"></ion-icon></span>
                                <input type="password" required>
                                <label>Password</label>
                            </div>
                            <div class="remember-forgot">
                                <label><input type="checkbox">I agree to the terms & conditions</label>
                            </div>
                            <button type="submit" class="btn">Register</button>
                            <div class="login-register">
                                <p>Already have an account?<a href="#"
                                class="login-link">Login</a></p>
                            </div>
                        </form>
                    </div>
                </div>